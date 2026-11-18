const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const User = require('../../src/models/User');

const createAdmin = async () => {
  const password = await bcrypt.hash('password123', 4);
  return User.create({
    fullName: 'Admin User',
    email: 'admin@example.com',
    phoneNumber: '0700000000',
    password,
    role: 'admin',
  });
};

describe('POST /api/auth/login', () => {
  test('rejects unknown credentials with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'wrong',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('returns a JWT and profile for valid credentials', async () => {
    await createAdmin();
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('admin@example.com');
    expect(res.body.user.password).toBeUndefined();
  });
});

describe('FR-AUTH-004 registration', () => {
  test('blocks member onboarding without an admin token', async () => {
    const res = await request(app).post('/api/auth/register-member').send({
      fullName: 'New Member',
      email: 'member@example.com',
      phoneNumber: '0711111111',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  test('allows an authenticated admin to onboard a member', async () => {
    await createAdmin();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register-member')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        fullName: 'New Member',
        email: 'member@example.com',
        phoneNumber: '0711111111',
        password: 'password123',
      });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('member');
  });
});
