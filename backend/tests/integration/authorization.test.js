const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const config = require('../../src/config');
const { createAdmin, createMember } = require('../helpers/factories');

const tokenFor = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1h' });

// Lowest-risk layer (plumbing already exercised by the unit-level FR tests above),
// but still worth a smoke test: FR-AUTH-003 global read-only enforcement at the HTTP boundary.
describe('FR-AUTH-003 — member write access is blocked at the route layer', () => {
  test('member GET requests succeed', async () => {
    const member = await createMember();
    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${tokenFor(member)}`);
    expect(res.status).toBe(200);
  });

  test('member POST to transactions/allocate is rejected with 403', async () => {
    const member = await createMember();
    const res = await request(app)
      .post('/api/transactions/allocate')
      .set('Authorization', `Bearer ${tokenFor(member)}`)
      .send({
        userId: member._id,
        totalAmount: 500,
        paymentMethod: 'mpesa',
        receiptNumber: 'RCPT-X',
        monthTarget: '2026-11',
        allocations: [{ type: 'office_contrib', amount: 500 }],
      });
    expect(res.status).toBe(403);
  });

  test('member POST to loans is rejected with 403', async () => {
    const member = await createMember();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${tokenFor(member)}`)
      .send({ userId: member._id, principalAmount: 1000, loanType: 'emergency' });
    expect(res.status).toBe(403);
  });

  test('admin POST to loans succeeds', async () => {
    const admin = await createAdmin();
    const member = await createMember();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ userId: member._id, principalAmount: 1000, loanType: 'emergency' });
    expect(res.status).toBe(201);
  });

  test('a suspended user is rejected even with a valid token (FR-AUTH-002)', async () => {
    const member = await createMember({ status: 'suspended' });
    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${tokenFor(member)}`);
    expect(res.status).toBe(403);
  });
});
