const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const userService = require('./userService');
const { formatKES } = require('../utils/money');
const { formatEAT } = require('../utils/dates');

// Same set LedgerPage.jsx (frontend) and StatementPage.jsx use for the pool
// total — only these entry types are the member's own money going IN. A
// loan_disbursement is money the Chama pays OUT to them (a debt, not
// equity), so it must never be summed alongside contributions into one
// "balance" the way an earlier version of this file did.
const CONTRIBUTION_TYPES = ['shares_savings', 'christmas_contrib', 'retreat_contrib', 'office_contrib', 'sitting_allowance'];

// Pulled out as its own function so the "don't sum loans into the
// contributions balance" fix is directly unit-testable, not just inferred
// from reading the PDF-rendering code around it.
const computeBalances = (transactions, loans) => {
  let contributionsBalance = 0;
  let finesCharged = 0;
  for (const txn of transactions) {
    if (txn.status !== 'active') continue;
    if (CONTRIBUTION_TYPES.includes(txn.type)) contributionsBalance += txn.amount;
    if (txn.type.startsWith('fine_')) finesCharged += txn.amount;
  }

  const outstandingLoans = loans
    .filter((l) => l.status === 'disbursed')
    .reduce((sum, l) => sum + (l.totalPayable - l.amountPaid), 0);

  return { contributionsBalance, finesCharged, outstandingLoans };
};
exports.computeBalances = computeBalances;

// Generates a member's personal statement as a PDF stream.
exports.streamMemberStatement = async (userId, res) => {
  const user = await userService.getUserById(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: 1 });
  const loans = await Loan.find({ userId });

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${user._id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Chama Financial Ledger — Member Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Member: ${user.fullName}`);
  doc.text(`Generated: ${formatEAT(new Date())}`);
  doc.moveDown();

  doc.fontSize(12).text('Transaction History', { underline: true });
  doc.moveDown(0.5);

  transactions.forEach((txn) => {
    doc
      .fontSize(10)
      .text(
        `${formatEAT(txn.createdAt)}  |  ${txn.type}  |  ${formatKES(txn.amount)}  |  ${txn.status}`
      );
  });

  const { contributionsBalance, finesCharged, outstandingLoans } = computeBalances(transactions, loans);

  doc.moveDown();
  doc.fontSize(12).text(`Contributions balance: ${formatKES(contributionsBalance)}`, { align: 'right' });
  doc.text(`Outstanding loans: ${formatKES(outstandingLoans)}`, { align: 'right' });
  doc.text(`Fines charged: ${formatKES(finesCharged)}`, { align: 'right' });
  doc.end();
};
