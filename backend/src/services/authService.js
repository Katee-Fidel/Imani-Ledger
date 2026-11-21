const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { avatarUrl } = require('../utils/avatarUrl');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');

const sign = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const toProfile = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  status: user.status,
  joinedDate: user.joinedDate,
  mustChangePassword: user.mustChangePassword,
  avatarUrl: avatarUrl(user),
});

// FR-AUTH-001
exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid email or password');
  if (user.status !== 'active') throw new UnauthorizedError('Invalid email or password');

  return { token: sign(user), user: toProfile(user) };
};

// FR-AUTH-004: admin-only onboarding, or public signup when explicitly enabled.
exports.registerMember = async ({ fullName, email, phoneNumber, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new BadRequestError('Email is already registered');

  const hashed = await bcrypt.hash(password, config.bcryptCost);
  const user = await User.create({ fullName, email, phoneNumber, password: hashed, role });
  return toProfile(user);
};

exports.toProfile = toProfile;
