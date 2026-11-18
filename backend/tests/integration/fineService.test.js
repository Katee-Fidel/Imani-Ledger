const fineService = require('../../src/services/fineService');
const configService = require('../../src/services/configService');
const loanService = require('../../src/services/loanService');
const transactionService = require('../../src/services/transactionService');
const Loan = require('../../src/models/Loan');
const { toCents } = require('../../src/utils/money');
const { createAdmin, createMember } = require('../helpers/factories');

describe('fineService.assessLateSharesFines — FR-FINE-002', () => {
  test('refuses to assess before the grace period has elapsed', async () => {
    const admin = await createAdmin();
    await configService.createBillingCycle({
      billingCycleMonth: '2099-01',
      sharesDueDate: new Date('2099-01-05'),
      sharesGracePeriodEndDate: new Date('2099-01-10'), // far in the future
      loanRepaymentDueDate: new Date('2099-01-15'),
    });

    await expect(fineService.assessLateSharesFines('2099-01', admin._id)).rejects.toThrow(
      /grace period has not yet elapsed/i
    );
  });

  test('fines members with no shares_savings posting, skips those who paid, and is idempotent', async () => {
    const admin = await createAdmin();
    const paidMember = await createMember();
    const latePayer = await createMember();

    await configService.createBillingCycle({
      billingCycleMonth: '2026-01',
      sharesDueDate: new Date('2026-01-05'),
      sharesGracePeriodEndDate: new Date('2026-01-10'), // already in the past relative to "today"
      loanRepaymentDueDate: new Date('2026-01-15'),
    });

    // The fine engine sweeps every active user regardless of role, so the admin
    // must also post shares_savings here to isolate the assertion to latePayer.
    for (const payer of [admin, paidMember]) {
      await transactionService.allocate(admin._id, {
        userId: payer._id,
        totalAmount: 1000,
        paymentMethod: 'mpesa',
        receiptNumber: `RCPT-SHARES-${payer._id}`,
        monthTarget: '2026-01',
        allocations: [{ type: 'shares_savings', amount: 1000 }],
      });
    }

    const firstRun = await fineService.assessLateSharesFines('2026-01', admin._id);
    expect(firstRun).toHaveLength(1);
    expect(String(firstRun[0].userId)).toBe(String(latePayer._id));
    expect(firstRun[0].amount).toBe(toCents(500));

    // Re-running for the same cycle must not double-fine the same member.
    const secondRun = await fineService.assessLateSharesFines('2026-01', admin._id);
    expect(secondRun).toHaveLength(0);
  });
});

describe('fineService.assessLateLoanFines — FR-FINE-003', () => {
  test('fines 20% of totalInterest on an overdue disbursed standard loan, and is idempotent', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 50000, loanType: 'standard' });
    await loanService.disburseLoan(loan._id);
    // Force the due date into the past to simulate an overdue loan.
    await Loan.findByIdAndUpdate(loan._id, { dueDate: new Date('2020-01-01') });

    const firstRun = await fineService.assessLateLoanFines(admin._id);
    expect(firstRun).toHaveLength(1);
    expect(firstRun[0].amount).toBe(Math.round(loan.totalInterest * 0.2));
    expect(String(firstRun[0].referenceId)).toBe(String(loan._id));

    const secondRun = await fineService.assessLateLoanFines(admin._id);
    expect(secondRun).toHaveLength(0);
  });

  test('does not fine an emergency loan or a loan that is not yet overdue', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const onTimeLoan = await loanService.createLoan({ userId: member._id, principalAmount: 5000, loanType: 'standard' });
    await loanService.disburseLoan(onTimeLoan._id); // dueDate is months in the future

    const emergencyLoan = await loanService.createLoan({ userId: member._id, principalAmount: 3000, loanType: 'emergency' });
    await loanService.disburseLoan(emergencyLoan._id);
    await Loan.findByIdAndUpdate(emergencyLoan._id, { dueDate: new Date('2020-01-01') });

    const fines = await fineService.assessLateLoanFines(admin._id);
    expect(fines).toHaveLength(0);
  });
});
