const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/chatbotController');
const router = express.Router();

router.post(
  '/triage',
  authMiddleware,
  [body('symptom').notEmpty().withMessage('Symptom description is required')],
  ctrl.triage
);

router.get('/slots/:doctorId', authMiddleware, ctrl.suggestAppointment);

module.exports = router;
