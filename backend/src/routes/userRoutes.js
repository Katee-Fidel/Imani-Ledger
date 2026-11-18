const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, enforceReadOnlyForMembers } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateStatusSchema, userIdParamsSchema } = require('../validators/userValidators');

router.use(authenticate, enforceReadOnlyForMembers);

// FR-AUTH-005: directory projection varies by requester role (handled in service).
router.get('/', userController.list);
router.get('/:id', validate({ params: userIdParamsSchema }), requireAdmin, userController.getById);
router.patch(
  '/:id/status',
  validate({ params: userIdParamsSchema, body: updateStatusSchema }),
  requireAdmin,
  userController.setStatus
);

module.exports = router;
