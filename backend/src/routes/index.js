const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/loans', require('./loanRoutes'));
router.use('/transactions', require('./transactionRoutes'));
router.use('/statements', require('./statementRoutes'));
router.use('/config', require('./configRoutes'));

module.exports = router;
