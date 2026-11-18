const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

exports.createLoanSchema = z.object({
  userId: objectId,
  principalAmount: z.number().positive(), // KES
  loanType: z.enum(['standard', 'emergency']),
});

exports.loanIdParamsSchema = z.object({ id: objectId });

exports.listLoansQuerySchema = z.object({
  userId: objectId.optional(),
  status: z.enum(['pending', 'disbursed', 'cleared']).optional(),
});
