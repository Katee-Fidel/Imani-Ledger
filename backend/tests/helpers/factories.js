const bcrypt = require('bcrypt');
const User = require('../../src/models/User');

let counter = 0;
const nextEmail = (prefix) => `${prefix}-${(counter += 1)}@example.com`;

exports.createUser = async (overrides = {}) => {
  const password = await bcrypt.hash(overrides.rawPassword || 'password123', 4);
  return User.create({
    fullName: overrides.fullName || 'Test User',
    email: overrides.email || nextEmail('user'),
    phoneNumber: overrides.phoneNumber || '0700000000',
    password,
    role: overrides.role || 'member',
    status: overrides.status || 'active',
  });
};

exports.createAdmin = (overrides = {}) => exports.createUser({ ...overrides, role: 'admin' });
exports.createMember = (overrides = {}) => exports.createUser({ ...overrides, role: 'member' });
