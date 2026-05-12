const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  [
    body('date').notEmpty().withMessage('date is required'),
    body('time').notEmpty().withMessage('time is required'),
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('doctorId').notEmpty().withMessage('doctorId is required')
  ],
  appointmentController.createAppointment
);

router.get('/patient/:patientId', authMiddleware, appointmentController.getAppointmentsByPatient);
router.get('/doctor/:doctorId', authMiddleware, appointmentController.getAppointmentsByDoctor);

router.patch(
  '/:appointmentId',
  authMiddleware,
  [
    body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  appointmentController.updateAppointment
);

router.delete('/:appointmentId', authMiddleware, appointmentController.deleteAppointment);

module.exports = router;