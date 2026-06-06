const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/blockchainController');
const router = express.Router();

router.get('/status', authMiddleware, ctrl.getStatus);
router.get('/verify/:recordId', authMiddleware, authMiddleware.requireRole('admin', 'doctor'), ctrl.verifyRecord);

module.exports = router;
