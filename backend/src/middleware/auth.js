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

  // A password reset by an admin locks the account to just these two routes
  // until the user sets their own password — enforced here, not only in the
  // frontend's routing, since this is a security boundary.
  // req.originalUrl (not req.path) because this middleware runs inside a
  // sub-router, where req.path is only relative to that router's mount point.
  const fullPath = req.originalUrl.split('?')[0];
  const isAllowedWhileLocked =
    (req.method === 'GET' && fullPath === '/api/auth/me') ||
    (req.method === 'PATCH' && fullPath === '/api/users/me/password');
  if (user.mustChangePassword && !isAllowedWhileLocked) {
    throw new ForbiddenError('You must set a new password before continuing');
  }

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
