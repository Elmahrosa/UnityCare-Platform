const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/iotController');
const router = express.Router();

router.get('/:patientId', authMiddleware, ctrl.getReadings);

router.get('/:patientId/vitals', authMiddleware, ctrl.getLatestVitals);

router.post(
  '/:patientId',
  authMiddleware,
  authMiddleware.requireRole('doctor', 'admin', 'nurse'),
  [
    body('deviceType').notEmpty().withMessage('deviceType is required'),
    body('deviceId').notEmpty().withMessage('deviceId is required'),
    body('metric').notEmpty().withMessage('metric is required'),
    body('value').notEmpty().withMessage('value is required'),
  ],
  ctrl.recordReading
);

module.exports = router;
