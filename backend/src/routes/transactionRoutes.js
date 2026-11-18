const router = require('express').Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, requireAdmin, enforceReadOnlyForMembers } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  allocateSchema,
  voidSchema,
  transactionIdParamsSchema,
  listTransactionsQuerySchema,
} = require('../validators/transactionValidators');

router.use(authenticate, enforceReadOnlyForMembers);

router.get('/', validate({ query: listTransactionsQuerySchema }), transactionController.list);
router.get(
  '/:id',
  validate({ params: transactionIdParamsSchema }),
  transactionController.getById
);
router.post('/allocate', requireAdmin, validate({ body: allocateSchema }), transactionController.allocate);

// FR-TXN-004
router.delete(
  '/:id',
  requireAdmin,
  validate({ params: transactionIdParamsSchema, body: voidSchema }),
  transactionController.voidTransaction
);

module.exports = router;
