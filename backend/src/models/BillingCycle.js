const mongoose = require('mongoose');

// FR-FINE-001
const billingCycleSchema = new mongoose.Schema(
  {
    billingCycleMonth: { type: String, required: true, unique: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    sharesDueDate: { type: Date, required: true },
    sharesGracePeriodEndDate: { type: Date, required: true },
    loanRepaymentDueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BillingCycle', billingCycleSchema);
