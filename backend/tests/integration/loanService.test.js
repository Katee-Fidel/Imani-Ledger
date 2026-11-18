const loanService = require('../../src/services/loanService');
const { toCents } = require('../../src/utils/money');
const { createMember } = require('../helpers/factories');

const monthsBetween = (from, to) =>
  (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());

describe('loanService — FR-LOAN-001/002/003 interest & term calculation', () => {
  test('standard loan tier 1 (<= KES 200,000): 10% flat interest, 6-month term', async () => {
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 200000, loanType: 'standard' });

    expect(loan.interestRate).toBe(0.1);
    expect(loan.totalInterest).toBe(toCents(20000));
    expect(loan.totalPayable).toBe(toCents(220000));

    const disbursed = await loanService.disburseLoan(loan._id);
    expect(monthsBetween(disbursed.disbursedDate, disbursed.dueDate)).toBe(6);
  });

  test('standard loan tier 2 (> KES 200,000): 10% flat interest, 12-month term', async () => {
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 250000, loanType: 'standard' });

    expect(loan.totalInterest).toBe(toCents(25000));
    expect(loan.totalPayable).toBe(toCents(275000));

    const disbursed = await loanService.disburseLoan(loan._id);
    expect(monthsBetween(disbursed.disbursedDate, disbursed.dueDate)).toBe(12);
  });

  test('emergency loan: 0% interest, 2-month term', async () => {
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 5000, loanType: 'emergency' });

    expect(loan.interestRate).toBe(0);
    expect(loan.totalInterest).toBe(0);
    expect(loan.totalPayable).toBe(toCents(5000));

    const disbursed = await loanService.disburseLoan(loan._id);
    expect(monthsBetween(disbursed.disbursedDate, disbursed.dueDate)).toBe(2);
  });
});

describe('loanService — disbursement and repayment guards', () => {
  test('rejects disbursing a loan that is not pending', async () => {
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 5000, loanType: 'emergency' });
    await loanService.disburseLoan(loan._id);

    await expect(loanService.disburseLoan(loan._id)).rejects.toThrow(/only pending loans/i);
  });

  test('rejects repayment on a loan that has not been disbursed', async () => {
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 5000, loanType: 'emergency' });
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      await expect(
        session.withTransaction(() => loanService.applyRepayment(loan._id, toCents(1000), session))
      ).rejects.toThrow(/not active for repayment/i);
    } finally {
      await session.endSession();
    }
  });

  test('a partial repayment reduces the balance but keeps the loan disbursed', async () => {
    const member = await createMember();
    const loan = await loanService.createLoan({ userId: member._id, principalAmount: 10000, loanType: 'emergency' });
    await loanService.disburseLoan(loan._id);

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => loanService.applyRepayment(loan._id, toCents(4000), session));
    } finally {
      await session.endSession();
    }

    const updated = await loanService.getLoanById(loan._id);
    expect(updated.status).toBe('disbursed');
    expect(updated.amountPaid).toBe(toCents(4000));
  });
});
