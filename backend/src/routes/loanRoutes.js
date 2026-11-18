const router = require('express').Router();
const loanController = require('../controllers/loanController');
const { authenticate, requireAdmin, enforceReadOnlyForMembers } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createLoanSchema,
  loanIdParamsSchema,
  listLoansQuerySchema,
} = require('../validators/loanValidators');

router.use(authenticate, enforceReadOnlyForMembers);

router.get('/', validate({ query: listLoansQuerySchema }), loanController.list);
router.get('/:id', validate({ params: loanIdParamsSchema }), loanController.getById);
router.post('/', requireAdmin, validate({ body: createLoanSchema }), loanController.create);
router.post(
  '/:id/disburse',
  requireAdmin,
  validate({ params: loanIdParamsSchema }),
  loanController.disburse
);

module.exports = router;
