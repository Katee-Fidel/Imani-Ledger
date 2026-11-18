const { z } = require('zod');

exports.updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']),
});

exports.userIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id'),
});
