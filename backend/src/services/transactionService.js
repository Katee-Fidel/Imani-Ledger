const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const loanService = require('./loanService');
const { toCents } = require('../utils/money');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const CHRISTMAS_MIN_KES = 2000;

// FR-TXN-002
const validateCategoryAmount = (type, amountCents) => {
  if (type === 'christmas_contrib' && amountCents < toCents(CHRISTMAS_MIN_KES)) {
    throw new BadRequestError(`christmas_contrib must be at least KES ${CHRISTMAS_MIN_KES}`);
  }
};

// FR-TXN-003: atomic bulk payment allocation across categories and/or loan repayments.
exports.allocate = async (adminId, payload) => {
  const { userId, totalAmount, paymentMethod, receiptNumber, monthTarget, allocations } = payload;

  const totalCents = toCents(totalAmount);
  const lineItemsCents = allocations.map((a) => toCents(a.amount));
  const sumCents = lineItemsCents.reduce((sum, c) => sum + c, 0);
  if (sumCents !== totalCents) {
    throw new BadRequestError('Sum of line item allocations must equal the total deposit amount');
  }

  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      created = [];
      for (let i = 0; i < allocations.length; i += 1) {
        const { type, referenceId } = allocations[i];
        const amountCents = lineItemsCents[i];
        validateCategoryAmount(type, amountCents);

        if (type === 'loan_repayment') {
          if (!referenceId) throw new BadRequestError('loan_repayment allocations require a referenceId');
          await loanService.applyRepayment(referenceId, amountCents, session);
        }

        const [txn] = await Transaction.create(
          [
            {
              userId,
              adminId,
              referenceId: type === 'loan_repayment' ? referenceId : undefined,
              type,
              amount: amountCents,
              monthTarget,
              paymentMethod,
              receiptNumber,
            },
          ],
          { session }
        );
        created.push(txn);
      }
    });
    return created;
  } finally {
    await session.endSession();
  }
};

// FR-LOAN-004: posts a disbursement entry in the ledger, within the caller's transaction session.
exports.postLoanDisbursement = async ({ userId, adminId, loanId, amountCents }, session) => {
  const [txn] = await Transaction.create(
    [{ userId, adminId, referenceId: loanId, type: 'loan_disbursement', amount: amountCents }],
    { session }
  );
  return txn;
};

exports.list = async (filter, { page, limit }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

exports.getById = async (id) => {
  const txn = await Transaction.findById(id);
  if (!txn) throw new NotFoundError('Transaction not found');
  return txn;
};

// FR-TXN-004: void via compensating contra-entry; the original record is never deleted.
exports.voidTransaction = async (id, adminId, remarks) => {
  const session = await mongoose.startSession();
  try {
    let contra;
    await session.withTransaction(async () => {
      const original = await Transaction.findById(id).session(session);
      if (!original) throw new NotFoundError('Transaction not found');
      if (original.status === 'voided') throw new BadRequestError('Transaction is already voided');

      original.status = 'voided';
      await original.save({ session });

      [contra] = await Transaction.create(
        [
          {
            userId: original.userId,
            adminId,
            referenceId: original.referenceId,
            type: 'contra_entry',
            amount: -original.amount,
            monthTarget: original.monthTarget,
            remarks,
            reversalOf: original._id,
          },
        ],
        { session }
      );
    });
    return contra;
  } finally {
    await session.endSession();
  }
};
