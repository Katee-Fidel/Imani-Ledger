const { z } = require('zod');
const { TYPES } = require('../models/Transaction');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const monthTarget = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

// FR-TXN-003: bulk payment allocation split across categories and/or loans.
exports.allocateSchema = z.object({
  userId: objectId,
  totalAmount: z.number().positive(), // KES
  paymentMethod: z.string().min(1),
  receiptNumber: z.string().min(1),
  monthTarget,
  allocations: z
    .array(
      z.object({
        type: z.enum(TYPES.filter((t) => t !== 'contra_entry')),
        amount: z.number().positive(), // KES
        referenceId: objectId.optional(), // required for loan_repayment
      })
    )
    .min(1),
});

// FR-TXN-004: voiding requires a mandatory reason, producing a contra-entry.
exports.voidSchema = z.object({
  remarks: z.string().min(1, 'A reason is required to void a transaction'),
});

exports.transactionIdParamsSchema = z.object({ id: objectId });

exports.listTransactionsQuerySchema = z.object({
  userId: objectId.optional(),
  type: z.enum(TYPES).optional(),
  monthTarget: monthTarget.optional(),
  status: z.enum(['active', 'voided']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});
