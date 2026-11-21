const bcrypt = require('bcrypt');
const User = require('../models/User');
const config = require('../config');
const { avatarUrl } = require('../utils/avatarUrl');
const { NotFoundError } = require('../utils/errors');

const ADMIN_FIELDS = 'fullName email phoneNumber role status joinedDate avatarUpdatedAt createdAt updatedAt';
const MEMBER_FIELDS = 'fullName phoneNumber role status joinedDate avatarUpdatedAt'; // FR-AUTH-005

const withAvatarUrl = (user) => {
  const obj = user.toObject();
  obj.avatarUrl = avatarUrl(user);
  delete obj.avatarUpdatedAt;
  return obj;
};

// FR-AUTH-005: members see a restricted directory projection.
exports.listUsers = async (requesterRole) => {
  const users = await User.find({})
    .select(requesterRole === 'admin' ? ADMIN_FIELDS : MEMBER_FIELDS)
    .sort({ fullName: 1 });
  return users.map(withAvatarUrl);
};

exports.getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

exports.setStatus = async (id, status) => {
  const user = await exports.getUserById(id);
  user.status = status;
  await user.save();
  return user;
};

// Self-service edit, deliberately limited to fullName/phoneNumber — role,
// status and email never pass through this endpoint.
exports.updateOwnProfile = async (id, { fullName, phoneNumber }) => {
  const user = await exports.getUserById(id);
  user.fullName = fullName;
  user.phoneNumber = phoneNumber;
  await user.save();
  return withAvatarUrl(user);
};

// Admin-initiated reset: the member must set their own password before
// doing anything else (enforced in the auth middleware).
exports.adminSetPassword = async (id, newPassword) => {
  const user = await exports.getUserById(id);
  user.password = await bcrypt.hash(newPassword, config.bcryptCost);
  user.mustChangePassword = true;
  await user.save();
};

// Self password change — used right after a forced reset, but works any time.
exports.changeOwnPassword = async (id, newPassword) => {
  const user = await exports.getUserById(id);
  user.password = await bcrypt.hash(newPassword, config.bcryptCost);
  user.mustChangePassword = false;
  await user.save();
};

exports.setAvatarUpdatedAt = async (id, date) => {
  const user = await exports.getUserById(id);
  user.avatarUpdatedAt = date;
  await user.save();
  return withAvatarUrl(user);
};
