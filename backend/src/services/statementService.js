const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const userService = require('./userService');
const { formatKES } = require('../utils/money');
const { formatEAT } = require('../utils/dates');

// Generates a member's personal statement as a PDF stream.
exports.streamMemberStatement = async (userId, res) => {
  const user = await userService.getUserById(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: 1 });

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

  let balance = 0;
  transactions.forEach((txn) => {
    if (txn.status === 'active') balance += txn.amount;
    doc
      .fontSize(10)
      .text(
        `${formatEAT(txn.createdAt)}  |  ${txn.type}  |  ${formatKES(txn.amount)}  |  ${txn.status}`
      );
  });

  doc.moveDown();
  doc.fontSize(12).text(`Net Balance: ${formatKES(balance)}`, { align: 'right' });
  doc.end();
};
