const BillingCycle = require('../models/BillingCycle');
const { BadRequestError, NotFoundError } = require('../utils/errors');

// FR-FINE-001
exports.createBillingCycle = async (payload) => {
  const existing = await BillingCycle.findOne({ billingCycleMonth: payload.billingCycleMonth });
  if (existing) throw new BadRequestError('Billing cycle already configured for this month');
  return BillingCycle.create(payload);
};

exports.listBillingCycles = async () => BillingCycle.find({}).sort({ billingCycleMonth: -1 });

exports.getBillingCycle = async (billingCycleMonth) => {
  const cycle = await BillingCycle.findOne({ billingCycleMonth });
  if (!cycle) throw new NotFoundError('Billing cycle not found');
  return cycle;
};
