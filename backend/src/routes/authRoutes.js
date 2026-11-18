const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { loginSchema, registerMemberSchema } = require('../validators/authValidators');

router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);

// FR-AUTH-004
router.post(
  '/register-member',
  authLimiter,
  authenticate,
  requireAdmin,
  validate({ body: registerMemberSchema }),
  authController.registerMember
);

router.get('/me', authenticate, authController.me);

module.exports = router;
