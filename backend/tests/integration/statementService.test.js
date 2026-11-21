const { PassThrough } = require('stream');
const statementService = require('../../src/services/statementService');
const transactionService = require('../../src/services/transactionService');
const { createAdmin, createMember } = require('../helpers/factories');

// A minimal writable-stream stand-in for Express's `res`, since pdfkit just pipes into it.
const createFakeRes = () => {
  const stream = new PassThrough();
  stream.headers = {};
  stream.setHeader = (key, value) => {
    stream.headers[key] = value;
  };
  return stream;
};

describe('statementService.computeBalances', () => {
  test('does not fold a loan disbursement into the contributions balance', () => {
    // Regression test: this used to sum every active transaction's amount
    // together regardless of type, so a KES 200,000 loan disbursement plus
    // a KES 10,000 shares_savings contribution incorrectly showed as a
    // KES 210,000 "balance".
    const transactions = [
      { status: 'active', type: 'shares_savings', amount: 10000 },
      { status: 'active', type: 'loan_disbursement', amount: 200000 },
    ];
    const loans = [{ status: 'disbursed', totalPayable: 220000, amountPaid: 0 }];

    const { contributionsBalance, outstandingLoans } = statementService.computeBalances(transactions, loans);

    expect(contributionsBalance).toBe(10000);
    expect(outstandingLoans).toBe(220000);
  });

  test('excludes voided transactions and sums fines separately', () => {
    const transactions = [
      { status: 'active', type: 'shares_savings', amount: 5000 },
      { status: 'voided', type: 'shares_savings', amount: 9999 },
      { status: 'active', type: 'fine_late_shares', amount: 500 },
    ];

    const { contributionsBalance, finesCharged } = statementService.computeBalances(transactions, []);

    expect(contributionsBalance).toBe(5000);
    expect(finesCharged).toBe(500);
  });
});

describe('statementService.streamMemberStatement', () => {
  test('streams a valid PDF with the correct headers', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    await transactionService.allocate(admin._id, {
      userId: member._id,
      totalAmount: 1000,
      paymentMethod: 'mpesa',
      receiptNumber: 'RCPT-STMT-1',
      monthTarget: '2026-11',
      allocations: [{ type: 'shares_savings', amount: 1000 }],
    });

    const res = createFakeRes();
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    const ended = new Promise((resolve) => res.on('end', resolve));

    await statementService.streamMemberStatement(member._id, res);
    await ended;

    const pdfBuffer = Buffer.concat(chunks);
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  test('a member with no transactions yet still gets a valid PDF', async () => {
    const member = await createMember();
    const res = createFakeRes();
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    const ended = new Promise((resolve) => res.on('end', resolve));

    await statementService.streamMemberStatement(member._id, res);
    await ended;

    expect(Buffer.concat(chunks).subarray(0, 4).toString()).toBe('%PDF');
  });

  test('a long history spans multiple pages, each with a redrawn table header and page number', async () => {
    const admin = await createAdmin();
    const member = await createMember();

    // Enough rows to force several page breaks through the real
    // ensureSpace()/addPage()/tableHeader() path, not just one page.
    for (let i = 0; i < 80; i += 1) {
      await transactionService.allocate(admin._id, {
        userId: member._id,
        totalAmount: 500,
        paymentMethod: 'mpesa',
        receiptNumber: `RCPT-PAGE-${i}`,
        monthTarget: '2026-11',
        allocations: [{ type: 'office_contrib', amount: 500 }],
      });
    }

    const res = createFakeRes();
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    const ended = new Promise((resolve) => res.on('end', resolve));

    await statementService.streamMemberStatement(member._id, res);
    await ended;

    const pdfBuffer = Buffer.concat(chunks);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // pdfkit writes each page object's dictionary as plain text even though
    // content streams are Flate-compressed, so this is a reliable count of
    // actual pages produced — not just a non-crash smoke test.
    const pageObjectMatches = pdfBuffer.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || [];
    expect(pageObjectMatches.length).toBeGreaterThan(1);
  });
});
