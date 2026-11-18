const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const loanService = require('../services/loanService');
const transactionService = require('../services/transactionService');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.status) filter.status = req.query.status;
  const loans = await loanService.listLoans(filter);
  res.json(loans);
});

exports.getById = asyncHandler(async (req, res) => {
  const loan = await loanService.getLoanById(req.params.id);
  res.json(loan);
});

exports.create = asyncHandler(async (req, res) => {
  const loan = await loanService.createLoan(req.body);
  res.status(201).json(loan);
});

// FR-LOAN-004: disbursement + ledger posting happen atomically.
exports.disburse = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let loan;
    await session.withTransaction(async () => {
      loan = await loanService.disburseLoan(req.params.id, session);
      await transactionService.postLoanDisbursement(
        { userId: loan.userId, adminId: req.user._id, loanId: loan._id, amountCents: loan.principalAmount },
        session
      );
    });
    res.json(loan);
  } finally {
    await session.endSession();
  }
});
