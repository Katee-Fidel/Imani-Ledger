const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');
const avatarService = require('../services/avatarService');
const { BadRequestError } = require('../utils/errors');

exports.list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.user.role);
  res.json(users);
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const user = await userService.setStatus(req.params.id, req.body.status);
  res.json(user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updated = await userService.updateOwnProfile(req.user._id, req.body);
  res.json(updated);
});

// Admin-only: resets another member's password and locks their account to
// "set a new password" until they do (see middleware/auth.js).
exports.adminSetPassword = asyncHandler(async (req, res) => {
  await userService.adminSetPassword(req.params.id, req.body.newPassword);
  res.json({ message: 'Password reset. The member must set a new one on next login.' });
});

exports.changeOwnPassword = asyncHandler(async (req, res) => {
  await userService.changeOwnPassword(req.user._id, req.body.newPassword);
  res.json({ message: 'Password updated.' });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new BadRequestError('No photo was uploaded');
  const updated = await avatarService.saveAvatar(req.user._id, req.file.buffer);
  res.json(updated);
});

exports.removeAvatar = asyncHandler(async (req, res) => {
  const updated = await avatarService.removeAvatar(req.user._id);
  res.json(updated);
});
