// Mirrors frontend/src/lib/format.js's TYPE_LABELS so the PDF statement
// reads the same way as the in-app ledger — never raw enum values.
const TYPE_LABELS = {
  shares_savings: 'Shares & savings',
  christmas_contrib: 'Christmas contribution',
  retreat_contrib: 'Retreat contribution',
  office_contrib: 'Office contribution',
  sitting_allowance: 'Sitting allowance',
  loan_disbursement: 'Loan disbursement',
  loan_repayment: 'Loan repayment',
  fine_late_shares: 'Late shares fine',
  fine_late_loan: 'Late loan fine',
  contra_entry: 'Reversal',
};

exports.formatType = (type) => TYPE_LABELS[type] || type;

exports.formatShortDate = (value) =>
  new Date(value).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', year: 'numeric' });
