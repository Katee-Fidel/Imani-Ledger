const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

// FR-AUTH-002: role/status are re-read from the DB on every request.
exports.authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new UnauthorizedError('Authentication required');

  let payload;
  try { payload = jwt.verify(token, config.jwtSecret); }
  catch { throw new UnauthorizedError('Invalid or expired token'); }

  const user = await User.findById(payload.id);
  if (!user) throw new UnauthorizedError('Invalid or expired token');
  if (user.status !== 'active') throw new ForbiddenError('Account is not active');
  req.user = user;
  next();
});

exports.requireAdmin = (req, _res, next) =>
  req.user?.role === 'admin' ? next() : next(new ForbiddenError('Admin access required'));

// FR-AUTH-003: members are global read-only.
exports.enforceReadOnlyForMembers = (req, _res, next) => {
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (isWrite && req.user?.role !== 'admin') {
    return next(new ForbiddenError('Members have read-only access'));
  }
  next();
};
