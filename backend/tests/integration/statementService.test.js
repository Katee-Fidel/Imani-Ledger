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
});
