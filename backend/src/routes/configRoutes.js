const router = require('express').Router();
const configController = require('../controllers/configController');
const { authenticate, requireAdmin, enforceReadOnlyForMembers } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { billingCycleSchema } = require('../validators/configValidators');

router.use(authenticate, enforceReadOnlyForMembers);

router.get('/', configController.list);
router.post('/', requireAdmin, validate({ body: billingCycleSchema }), configController.create);

// FR-FINE-002 / FR-FINE-003: admin-triggered penalty assessment.
router.post('/:billingCycleMonth/assess-late-shares', requireAdmin, configController.assessLateShares);
router.post('/assess-late-loans', requireAdmin, configController.assessLateLoans);

module.exports = router;
