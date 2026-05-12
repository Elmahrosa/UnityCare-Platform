const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/medicalRecordController');

const router = express.Router();

const recordValidation = [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('diagnosis').notEmpty().withMessage('diagnosis is required'),
    body('treatment').notEmpty().withMessage('treatment is required'),
];

// Create record — doctors only
router.post(
    '/',
    authMiddleware,
    authMiddleware.requireRole('doctor', 'admin'),
    recordValidation,
    ctrl.createRecord
);

// Get all records for a patient
router.get('/patient/:patientId', authMiddleware, ctrl.getPatientRecords);

// Export patient data (GDPR portability)
router.get('/patient/:patientId/export', authMiddleware, ctrl.exportPatientData);

// Get a single record
router.get('/:recordId', authMiddleware, ctrl.getRecord);

// Update a record — doctor (owner) or admin
router.patch('/:recordId', authMiddleware, ctrl.updateRecord);

// Soft-delete — admin only
router.delete(
    '/:recordId',
    authMiddleware,
    authMiddleware.requireRole('admin'),
    ctrl.deleteRecord
);

module.exports = router;