const { z } = require('zod');

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// FR-AUTH-004
exports.registerMemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['admin', 'member']).default('member'),
});
