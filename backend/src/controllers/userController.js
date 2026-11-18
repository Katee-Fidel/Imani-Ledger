const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

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
