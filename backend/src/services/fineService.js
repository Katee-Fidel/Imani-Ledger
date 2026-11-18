const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { toCents } = require('../utils/money');
const { BadRequestError } = require('../utils/errors');
const configService = require('./configService');

const LATE_SHARES_FINE_KES = 500;
const LATE_LOAN_FINE_RATE = 0.2;

// FR-FINE-002: flat fine per active member with zero shares_savings postings for the cycle.
// Idempotent: a member already fined for this monthTarget is skipped.
exports.assessLateSharesFines = async (billingCycleMonth, adminId) => {
  const cycle = await configService.getBillingCycle(billingCycleMonth);
  if (new Date() <= cycle.sharesGracePeriodEndDate) {
    throw new BadRequestError('Grace period has not yet elapsed for this billing cycle');
  }

  const members = await User.find({ status: 'active' });
  const created = [];

  for (const member of members) {
    const [hasPaid, alreadyFined] = await Promise.all([
      Transaction.exists({
        userId: member._id,
        type: 'shares_savings',
        monthTarget: billingCycleMonth,
        status: 'active',
      }),
      Transaction.exists({
        userId: member._id,
        type: 'fine_late_shares',
        monthTarget: billingCycleMonth,
      }),
    ]);

    if (!hasPaid && !alreadyFined) {
      const txn = await Transaction.create({
        userId: member._id,
        adminId,
        type: 'fine_late_shares',
        amount: toCents(LATE_SHARES_FINE_KES),
        monthTarget: billingCycleMonth,
        remarks: 'Automated late shares penalty',
      });
      created.push(txn);
    }
  }
  return created;
};

// FR-FINE-003: 20% of totalInterest once a disbursed standard loan passes its dueDate unpaid.
exports.assessLateLoanFines = async (adminId) => {
  const overdueLoans = await Loan.find({
    status: 'disbursed',
    loanType: 'standard',
    dueDate: { $lt: new Date() },
  });

  const created = [];
  for (const loan of overdueLoans) {
    const alreadyFined = await Transaction.exists({ referenceId: loan._id, type: 'fine_late_loan' });
    if (alreadyFined) continue;

    const fineAmount = Math.round(loan.totalInterest * LATE_LOAN_FINE_RATE);
    const txn = await Transaction.create({
      userId: loan.userId,
      adminId,
      referenceId: loan._id,
      type: 'fine_late_loan',
      amount: fineAmount,
      remarks: 'Automated late loan clearance penalty',
    });
    created.push(txn);
  }
  return created;
};
