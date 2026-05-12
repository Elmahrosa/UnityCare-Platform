const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   GET api/analytics/trends
// @desc    Get health trends over time
// @access  Private/Admin/Doctor
router.get(
    '/trends',
    authMiddleware,
    authMiddleware.requireRole('admin', 'doctor'),
    analyticsController.getHealthTrends
);

// ✅ ADDED: appointment status stats endpoint
// @route   GET api/analytics/stats
// @desc    Get appointment status breakdown
// @access  Private/Admin
router.get(
    '/stats',
    authMiddleware,
    authMiddleware.requireRole('admin'),
    analyticsController.getAppointmentStats
);

module.exports = router;