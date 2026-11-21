const { z } = require('zod');

exports.updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']),
});

exports.userIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id'),
});

// Deliberately excludes role/status/email — those never go through self-service.
exports.updateProfileSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(1),
});

exports.setPasswordSchema = z.object({
  newPassword: z.string().min(8),
});
