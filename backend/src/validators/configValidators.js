const { z } = require('zod');

// FR-FINE-001
exports.billingCycleSchema = z.object({
  billingCycleMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM'),
  sharesDueDate: z.coerce.date(),
  sharesGracePeriodEndDate: z.coerce.date(),
  loanRepaymentDueDate: z.coerce.date(),
});
