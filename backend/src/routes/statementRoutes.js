const router = require('express').Router();
const statementController = require('../controllers/statementController');
const { authenticate } = require('../middleware/auth');

router.get('/:userId', authenticate, statementController.download);

module.exports = router;
