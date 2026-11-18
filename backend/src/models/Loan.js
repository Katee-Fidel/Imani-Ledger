const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    principalAmount: { type: Number, required: true }, // integer cents
    loanType: { type: String, enum: ['standard', 'emergency'], required: true },
    interestRate: { type: Number, required: true },
    totalInterest: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'disbursed', 'cleared'], default: 'pending' },
    disbursedDate: Date,
    dueDate: Date,
    clearedDate: Date,
  },
  { timestamps: true }
);

loanSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Loan', loanSchema);
