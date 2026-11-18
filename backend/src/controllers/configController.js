const asyncHandler = require('../utils/asyncHandler');
const configService = require('../services/configService');
const fineService = require('../services/fineService');

exports.create = asyncHandler(async (req, res) => {
  const cycle = await configService.createBillingCycle(req.body);
  res.status(201).json(cycle);
});

exports.list = asyncHandler(async (req, res) => {
  const cycles = await configService.listBillingCycles();
  res.json(cycles);
});

// FR-FINE-002: admin-triggered assessment (also runnable as a scheduled job).
exports.assessLateShares = asyncHandler(async (req, res) => {
  const created = await fineService.assessLateSharesFines(req.params.billingCycleMonth, req.user._id);
  res.json({ finesCreated: created.length, fines: created });
});

// FR-FINE-003
exports.assessLateLoans = asyncHandler(async (req, res) => {
  const created = await fineService.assessLateLoanFines(req.user._id);
  res.json({ finesCreated: created.length, fines: created });
});
