const Loan = require('../models/Loan');
const { toCents } = require('../utils/money');
const { addMonths } = require('../utils/dates');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const STANDARD_TIER1_MAX_KES = 200000;

// FR-LOAN-001/002/003: compute interest + payable at creation time (upfront, flat).
const computeTerms = (principalAmountCents, loanType) => {
  if (loanType === 'emergency') {
    // FR-LOAN-003
    return { interestRate: 0, totalInterest: 0, totalPayable: principalAmountCents, termMonths: 2 };
  }
  // FR-LOAN-001 / FR-LOAN-002
  const interestRate = 0.1;
  const totalInterest = Math.round(principalAmountCents * interestRate);
  const termMonths = principalAmountCents > toCents(STANDARD_TIER1_MAX_KES) ? 12 : 6;
  return { interestRate, totalInterest, totalPayable: principalAmountCents + totalInterest, termMonths };
};

exports.createLoan = async ({ userId, principalAmount, loanType }) => {
  const principalAmountCents = toCents(principalAmount);
  const { interestRate, totalInterest, totalPayable } = computeTerms(principalAmountCents, loanType);

  return Loan.create({
    userId,
    principalAmount: principalAmountCents,
    loanType,
    interestRate,
    totalInterest,
    totalPayable,
    status: 'pending',
  });
};

// FR-AUTH-003: the loan book is globally visible, so every row names its
// borrower — only `fullName`, not the rest of their account, and only here
// on the read path (disburseLoan/applyRepayment use getLoanById unpopulated,
// since they pass userId on to Transaction.create and must not get back a
// populated sub-document in its place).
exports.listLoans = async (filter) => Loan.find(filter).sort({ createdAt: -1 }).populate('userId', 'fullName');

exports.getLoanById = async (id, session) => {
  const loan = await Loan.findById(id).session(session || null);
  if (!loan) throw new NotFoundError('Loan not found');
  return loan;
};

// FR-LOAN-004: disbursement sets dueDate from the actual disbursedDate, per loan term.
exports.disburseLoan = async (id, session) => {
  const loan = await exports.getLoanById(id, session);
  if (loan.status !== 'pending') throw new BadRequestError('Only pending loans can be disbursed');

  const { termMonths } = computeTerms(loan.principalAmount, loan.loanType);
  loan.status = 'disbursed';
  loan.disbursedDate = new Date();
  loan.dueDate = addMonths(loan.disbursedDate, termMonths);
  await loan.save({ session });
  return loan;
};

// FR-LOAN-005: applies a repayment amount (cents) to a disbursed loan, within a transaction session.
exports.applyRepayment = async (loanId, amountCents, session) => {
  const loan = await Loan.findById(loanId).session(session);
  if (!loan) throw new NotFoundError('Loan not found');
  if (loan.status !== 'disbursed') throw new BadRequestError('Loan is not active for repayment');

  const remaining = loan.totalPayable - loan.amountPaid;
  if (amountCents > remaining) {
    throw new BadRequestError(`Repayment exceeds remaining loan balance of ${remaining}`);
  }

  loan.amountPaid += amountCents;
  if (loan.amountPaid >= loan.totalPayable) {
    loan.status = 'cleared';
    loan.clearedDate = new Date();
  }
  await loan.save({ session });
  return loan;
};

exports.computeTerms = computeTerms;
