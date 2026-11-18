const mongoose = require('mongoose');

const TYPES = [
  'shares_savings', 'christmas_contrib', 'retreat_contrib', 'office_contrib', 'sitting_allowance',
  'loan_disbursement', 'loan_repayment', 'fine_late_shares', 'fine_late_loan', 'contra_entry',
];

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // FR-TXN-004
    referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    type: { type: String, enum: TYPES, required: true },
    amount: { type: Number, required: true }, // integer cents; negative for contra-entries
    monthTarget: { type: String, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    paymentMethod: { type: String },
    receiptNumber: { type: String },
    remarks: { type: String },
    status: { type: String, enum: ['active', 'voided'], default: 'active' },
    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, monthTarget: 1 });
transactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.TYPES = TYPES;
