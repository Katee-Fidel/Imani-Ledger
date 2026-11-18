const User = require('../models/User');
const { NotFoundError } = require('../utils/errors');

const ADMIN_FIELDS = 'fullName email phoneNumber role status joinedDate createdAt updatedAt';
const MEMBER_FIELDS = 'fullName phoneNumber role status joinedDate'; // FR-AUTH-005

// FR-AUTH-005: members see a restricted directory projection.
exports.listUsers = async (requesterRole) =>
  User.find({}).select(requesterRole === 'admin' ? ADMIN_FIELDS : MEMBER_FIELDS).sort({ fullName: 1 });

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
