const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/monitoringController');
const router = express.Router();

router.get('/health', ctrl.getSystemHealth);

router.get('/metrics', authMiddleware, authMiddleware.requireRole('admin'), ctrl.getMetrics);

module.exports = router;
