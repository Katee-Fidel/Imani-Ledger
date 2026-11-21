const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const userService = require('./userService');
const { formatKES } = require('../utils/money');
const { formatEAT } = require('../utils/dates');
const { formatType, formatShortDate } = require('../utils/labels');
const { getMarkPng } = require('../utils/brandAssets');

// Same hex values as frontend/src/index.css's @theme tokens — the PDF uses
// the identical palette, not a reinterpretation of it.
const COLOR = {
  ink: '#0b142d',
  navy: '#152f67',
  gold: '#dda932',
  goldDeep: '#8a6512',
  rule: '#d7deea',
  rust: '#b3431e',
};

const PAGE_MARGIN = 50;
const COLS = { date: 90, entry: 230, status: 65 }; // amount takes the remainder, right-aligned

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

const contentWidth = (doc) => doc.page.width - PAGE_MARGIN * 2;

// The logo's navy strokes need a light background to stay visible (same
// lesson as the login page) — so the masthead stays on the plain white page
// background rather than a navy band, and the brand comes through in the
// gold rule, the navy headings, and the stat-tile treatment instead.
async function drawMasthead(doc, user) {
  const mark = await getMarkPng();
  const markHeight = 28;
  const markWidth = markHeight * (380 / 175); // mark.svg's own aspect ratio

  doc.image(mark, PAGE_MARGIN, doc.y, { height: markHeight });
  doc
    .fillColor(COLOR.navy)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('Imani Ledger', PAGE_MARGIN + markWidth + 10, doc.y - markHeight / 2 - 8);
  doc
    .fillColor(COLOR.ink)
    .font('Helvetica')
    .fontSize(10)
    .text('Member statement', PAGE_MARGIN + markWidth + 10, doc.y);

  doc.y = Math.max(doc.y, PAGE_MARGIN + markHeight) + 10;
  goldRule(doc);
  doc.moveDown(0.8);

  doc.fillColor(COLOR.ink).font('Helvetica-Bold').fontSize(11).text(user.fullName);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLOR.ink)
    .text(`${user.email} · ${user.phoneNumber}`);
  textMuted(doc, `Generated ${formatEAT(new Date())}`);
  doc.moveDown(1);
}

function goldRule(doc) {
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + contentWidth(doc), doc.y)
    .lineWidth(2)
    .strokeColor(COLOR.gold)
    .stroke();
}

function hairline(doc, y) {
  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + contentWidth(doc), y)
    .lineWidth(0.75)
    .strokeColor(COLOR.rule)
    .stroke();
}

// Mirrors the web app's StatFigure: a label, a big number, a short gold
// underline — not a boxed card with a shadow.
function statFigure(doc, x, width, label, value, color) {
  const top = doc.y;
  doc.fillColor(COLOR.ink).fillOpacity(0.6).font('Helvetica').fontSize(9).text(label, x, top, { width });
  doc
    .fillOpacity(1)
    .fillColor(color)
    .font('Helvetica-Bold')
    .fontSize(17)
    .text(value, x, top + 14, { width });
  doc
    .moveTo(x, top + 40)
    .lineTo(x + 32, top + 40)
    .lineWidth(2.5)
    .strokeColor(COLOR.gold)
    .stroke();
}

function textMuted(doc, text) {
  doc.fillColor(COLOR.ink).fillOpacity(0.6).font('Helvetica').fontSize(9).text(text);
  doc.fillOpacity(1);
}

function tableHeader(doc) {
  const y = doc.y;
  const amountX = PAGE_MARGIN + COLS.date + COLS.entry + COLS.status;
  const amountWidth = contentWidth(doc) - COLS.date - COLS.entry - COLS.status;

  doc.fillColor(COLOR.ink).fillOpacity(0.6).font('Helvetica-Bold').fontSize(9);
  doc.text('Date', PAGE_MARGIN, y, { width: COLS.date });
  doc.text('Entry', PAGE_MARGIN + COLS.date, y, { width: COLS.entry });
  doc.text('Status', PAGE_MARGIN + COLS.date + COLS.entry, y, { width: COLS.status });
  doc.text('Amount', amountX, y, { width: amountWidth, align: 'right' });
  doc.fillOpacity(1);

  doc.y = y + 14;
  hairline(doc, doc.y);
  doc.moveDown(0.5);
}

function tableRow(doc, txn) {
  const y = doc.y;
  const amountX = PAGE_MARGIN + COLS.date + COLS.entry + COLS.status;
  const amountWidth = contentWidth(doc) - COLS.date - COLS.entry - COLS.status;
  const voided = txn.status === 'voided';

  doc.fillOpacity(voided ? 0.45 : 1);
  doc.fillColor(COLOR.ink).font('Helvetica').fontSize(9);
  doc.text(formatShortDate(txn.createdAt), PAGE_MARGIN, y, { width: COLS.date });
  doc.text(formatType(txn.type), PAGE_MARGIN + COLS.date, y, { width: COLS.entry });
  doc
    .fillColor(voided ? COLOR.ink : COLOR.navy)
    .text(voided ? 'Voided' : 'Active', PAGE_MARGIN + COLS.date + COLS.entry, y, { width: COLS.status });
  doc
    .fillColor(txn.type.startsWith('fine_') ? COLOR.rust : COLOR.ink)
    .text(formatKES(txn.amount), amountX, y, { width: amountWidth, align: 'right' });
  doc.fillOpacity(1);

  doc.y = y + 16;
  hairline(doc, doc.y);
  doc.moveDown(0.4);
}

const ROW_HEIGHT = 20;
function ensureSpace(doc) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + ROW_HEIGHT > bottom) {
    doc.addPage();
    tableHeader(doc);
  }
}

// Generates a member's personal statement as a PDF stream.
exports.streamMemberStatement = async (userId, res) => {
  const user = await userService.getUserById(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: 1 });
  const loans = await Loan.find({ userId });
  const { contributionsBalance, finesCharged, outstandingLoans } = computeBalances(transactions, loans);

  // Buffered so page numbers can be stamped on every page once the total
  // page count is known, at the cost of holding the whole PDF in memory
  // before it streams — fine at this app's scale (one member's ledger).
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${user._id}.pdf"`);
  doc.pipe(res);

  await drawMasthead(doc, user);

  const colWidth = contentWidth(doc) / 3;
  const statsTop = doc.y;
  statFigure(doc, PAGE_MARGIN, colWidth - 10, 'Contributions balance', formatKES(contributionsBalance), COLOR.navy);
  doc.y = statsTop;
  statFigure(doc, PAGE_MARGIN + colWidth, colWidth - 10, 'Outstanding loans', formatKES(outstandingLoans), COLOR.rust);
  doc.y = statsTop;
  statFigure(doc, PAGE_MARGIN + colWidth * 2, colWidth - 10, 'Fines charged', formatKES(finesCharged), COLOR.rust);
  doc.y = statsTop + 55;

  doc.fillColor(COLOR.navy).font('Helvetica-Bold').fontSize(12).text('Transaction history');
  doc.moveDown(0.5);

  if (transactions.length === 0) {
    textMuted(doc, 'No transactions have been recorded yet.');
  } else {
    tableHeader(doc);
    transactions.forEach((txn) => {
      ensureSpace(doc);
      tableRow(doc, txn);
    });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .fillOpacity(0.6)
      .fillColor(COLOR.ink)
      .font('Helvetica')
      .fontSize(8)
      .text(`Page ${i - range.start + 1} of ${range.count}`, PAGE_MARGIN, doc.page.height - 35, {
        width: contentWidth(doc),
        align: 'center',
      });
    doc.fillOpacity(1);
  }

  doc.end();
};
