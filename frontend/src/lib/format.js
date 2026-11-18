// The backend stores money as integer cents; the API returns it that way too.
export const formatKES = (cents) =>
  `KES ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', year: 'numeric' });

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

export const formatType = (type) => TYPE_LABELS[type] || type;
