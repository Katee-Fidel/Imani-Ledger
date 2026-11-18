const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

// FR-AUTH-004: admin-only onboarding (route is gated by requireAdmin).
exports.registerMember = asyncHandler(async (req, res) => {
  const user = await authService.registerMember(req.body);
  res.status(201).json(user);
});

exports.me = asyncHandler(async (req, res) => {
  res.json(authService.toProfile(req.user));
});
