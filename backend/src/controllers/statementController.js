const asyncHandler = require('../utils/asyncHandler');
const statementService = require('../services/statementService');
const { ForbiddenError } = require('../utils/errors');

// Members may only download their own statement; admins may download any member's.
exports.download = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;
  if (req.user.role !== 'admin' && String(req.user._id) !== targetUserId) {
    throw new ForbiddenError('You may only download your own statement');
  }
  await statementService.streamMemberStatement(targetUserId, res);
});
