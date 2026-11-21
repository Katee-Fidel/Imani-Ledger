const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, enforceReadOnlyForMembers } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  updateStatusSchema,
  userIdParamsSchema,
  updateProfileSchema,
  setPasswordSchema,
} = require('../validators/userValidators');

router.use(authenticate);

// FR-AUTH-005: directory projection varies by requester role (handled in service).
router.get('/', userController.list);

// Self-service routes — any authenticated user acting on their own account.
// These must be declared before the "/:id" routes below, or Express would
// match "me" as an :id value instead.
router.patch('/me', validate({ body: updateProfileSchema }), userController.updateProfile);
router.patch('/me/password', validate({ body: setPasswordSchema }), userController.changeOwnPassword);
router.post('/me/avatar', avatarUpload.single('photo'), userController.uploadAvatar);
router.delete('/me/avatar', userController.removeAvatar);

// Admin-only routes.
router.get(
  '/:id',
  enforceReadOnlyForMembers,
  validate({ params: userIdParamsSchema }),
  requireAdmin,
  userController.getById
);
router.patch(
  '/:id/status',
  enforceReadOnlyForMembers,
  validate({ params: userIdParamsSchema, body: updateStatusSchema }),
  requireAdmin,
  userController.setStatus
);
router.patch(
  '/:id/password',
  enforceReadOnlyForMembers,
  validate({ params: userIdParamsSchema, body: setPasswordSchema }),
  requireAdmin,
  userController.adminSetPassword
);

module.exports = router;
