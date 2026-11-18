const transactionService = require('../../src/services/transactionService');
const loanService = require('../../src/services/loanService');
const Transaction = require('../../src/models/Transaction');
const Loan = require('../../src/models/Loan');
const { toCents } = require('../../src/utils/money');
const { createAdmin, createMember } = require('../helpers/factories');

// Highest risk surface: this is real money moving through an ACID transaction.
describe('transactionService.allocate — FR-TXN-003 atomic bulk allocation', () => {
  test('splits a deposit across categories when line items sum to the total', async () => {
    const admin = await createAdmin();
    const member = await createMember();

    const created = await transactionService.allocate(admin._id, {
      userId: member._id,
      totalAmount: 2500,
      paymentMethod: 'mpesa',
      receiptNumber: 'RCPT-1',
      monthTarget: '2026-11',
      allocations: [
        { type: 'shares_savings', amount: 2000 },
        { type: 'office_contrib', amount: 500 },
      ],
    });

    expect(created).toHaveLength(2);
    const stored = await Transaction.find({ userId: member._id });
    expect(stored).toHaveLength(2);
    expect(stored.map((t) => t.amount).sort((a, b) => a - b)).toEqual([toCents(500), toCents(2000)]);
    expect(stored.every((t) => String(t.adminId) === String(admin._id))).toBe(true);
  });

  test('rejects and persists nothing when line items do not sum to the total', async () => {
    const admin = await createAdmin();
    const member = await createMember();

    await expect(
      transactionService.allocate(admin._id, {
        userId: member._id,
        totalAmount: 2500,
        paymentMethod: 'mpesa',
        receiptNumber: 'RCPT-2',
        monthTarget: '2026-11',
        allocations: [{ type: 'shares_savings', amount: 2000 }], // 500 short
      })
    ).rejects.toThrow(/sum of line item/i);

    expect(await Transaction.countDocuments({})).toBe(0);
  });

  test('FR-TXN-002: rejects christmas_contrib under KES 2000 and rolls back the whole batch', async () => {
    const admin = await createAdmin();
    const member = await createMember();

    await expect(
      transactionService.allocate(admin._id, {
        userId: member._id,
        totalAmount: 2500,
        paymentMethod: 'mpesa',
        receiptNumber: 'RCPT-3',
        monthTarget: '2026-11',
        allocations: [
          { type: 'shares_savings', amount: 1000 }, // would otherwise be valid
          { type: 'christmas_contrib', amount: 1500 }, // below the 2000 floor
        ],
      })
    ).rejects.toThrow(/christmas_contrib/i);

    // The valid shares_savings line must not have been persisted either — all or nothing.
    expect(await Transaction.countDocuments({})).toBe(0);
  });

  test('FR-LOAN-005: a loan_repayment allocation pays down the loan and auto-clears it when fully paid', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 10000, loanType: 'emergency' });
    await loanService.disburseLoan(loan._id);

    await transactionService.allocate(admin._id, {
      userId: member._id,
      totalAmount: 10000,
      paymentMethod: 'mpesa',
      receiptNumber: 'RCPT-4',
      monthTarget: '2026-11',
      allocations: [{ type: 'loan_repayment', amount: 10000, referenceId: String(loan._id) }],
    });

    const updated = await Loan.findById(loan._id);
    expect(updated.status).toBe('cleared');
    expect(updated.amountPaid).toBe(toCents(10000));
    expect(updated.clearedDate).toBeTruthy();
  });

  test('rejects a repayment exceeding the remaining balance and rolls back the ledger entry too', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 10000, loanType: 'emergency' });
    await loanService.disburseLoan(loan._id);

    await expect(
      transactionService.allocate(admin._id, {
        userId: member._id,
        totalAmount: 15000,
        paymentMethod: 'mpesa',
        receiptNumber: 'RCPT-5',
        monthTarget: '2026-11',
        allocations: [{ type: 'loan_repayment', amount: 15000, referenceId: String(loan._id) }],
      })
    ).rejects.toThrow(/exceeds remaining loan balance/i);

    const unchanged = await Loan.findById(loan._id);
    expect(unchanged.amountPaid).toBe(0);
    expect(unchanged.status).toBe('disbursed');
    expect(await Transaction.countDocuments({})).toBe(0);
  });
});

describe('transactionService.voidTransaction — FR-TXN-004 audit-safe correction', () => {
  test('marks the original voided and posts a compensating contra-entry', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const [original] = await transactionService.allocate(admin._id, {
      userId: member._id,
      totalAmount: 2000,
      paymentMethod: 'mpesa',
      receiptNumber: 'RCPT-6',
      monthTarget: '2026-11',
      allocations: [{ type: 'shares_savings', amount: 2000 }],
    });

    const contra = await transactionService.voidTransaction(original._id, admin._id, 'Duplicate entry');

    const reloadedOriginal = await Transaction.findById(original._id);
    expect(reloadedOriginal.status).toBe('voided');
    expect(contra.type).toBe('contra_entry');
    expect(contra.amount).toBe(-original.amount);
    expect(contra.reversalOf.toString()).toBe(original._id.toString());
    expect(contra.remarks).toBe('Duplicate entry');

    // Original document must still exist — hard deletion is prohibited (CON-TECH-002).
    expect(reloadedOriginal).not.toBeNull();
  });

  test('rejects voiding an already-voided transaction', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const [original] = await transactionService.allocate(admin._id, {
      userId: member._id,
      totalAmount: 500,
      paymentMethod: 'mpesa',
      receiptNumber: 'RCPT-7',
      monthTarget: '2026-11',
      allocations: [{ type: 'office_contrib', amount: 500 }],
    });
    await transactionService.voidTransaction(original._id, admin._id, 'First void');

    await expect(
      transactionService.voidTransaction(original._id, admin._id, 'Second void')
    ).rejects.toThrow(/already voided/i);
  });
});
