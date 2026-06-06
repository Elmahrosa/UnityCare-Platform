const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/careController');
const router = express.Router();

router.get('/', authMiddleware, ctrl.getPlans);

router.post(
  '/',
  authMiddleware,
  authMiddleware.requireRole('doctor', 'admin'),
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('diagnosis').notEmpty().withMessage('diagnosis is required'),
  ],
  ctrl.createPlan
);

router.patch('/:planId', authMiddleware, authMiddleware.requireRole('doctor', 'admin'), ctrl.updatePlan);

router.delete('/:planId', authMiddleware, authMiddleware.requireRole('admin'), ctrl.deletePlan);

module.exports = router;
