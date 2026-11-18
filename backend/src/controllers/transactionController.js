const asyncHandler = require('../utils/asyncHandler');
const transactionService = require('../services/transactionService');

exports.allocate = asyncHandler(async (req, res) => {
  const created = await transactionService.allocate(req.user._id, req.body);
  res.status(201).json(created);
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, ...filter } = req.query;
  const result = await transactionService.list(filter, { page, limit });
  res.json(result);
});

exports.getById = asyncHandler(async (req, res) => {
  const txn = await transactionService.getById(req.params.id);
  res.json(txn);
});

// FR-TXN-004
exports.voidTransaction = asyncHandler(async (req, res) => {
  const contra = await transactionService.voidTransaction(req.params.id, req.user._id, req.body.remarks);
  res.json(contra);
});
