const MedicalRecord = require('../models/MedicalRecord');
const { validationResult } = require('express-validator');

// Create a medical record (doctor only)
exports.createRecord = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, diagnosis, treatment, medications, notes } = req.body;

    try {
        const record = new MedicalRecord({
            patient: patientId,
            doctor:  req.user._id,
            diagnosis,
            treatment,
            medications: medications || [],
            notes,
        });

        await record.save();
        res.status(201).json(record);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all records for a patient (patient sees own; doctor/admin sees any)
exports.getPatientRecords = async (req, res) => {
    const { patientId } = req.params;

    // Patients may only retrieve their own records
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const records = await MedicalRecord.find({
            patient:   patientId,
            deletedAt: null,
        })
            .populate('doctor', 'name email')
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get a single record by ID
exports.getRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.recordId)
            .populate('doctor',  'name email')
            .populate('patient', 'name email');

        if (!record || record.deletedAt) {
            return res.status(404).json({ msg: 'Record not found' });
        }

        // Patients can only view their own records
        if (
            req.user.role === 'patient' &&
            record.patient._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        res.json(record);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update a record (doctor who created it, or admin)
exports.updateRecord = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const record = await MedicalRecord.findById(req.params.recordId);
        if (!record || record.deletedAt) {
            return res.status(404).json({ msg: 'Record not found' });
        }

        if (
            req.user.role !== 'admin' &&
            record.doctor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ msg: 'Only the creating doctor or admin can update records' });
        }

        const { diagnosis, treatment, medications, notes, integrityHash } = req.body;
        if (diagnosis)     record.diagnosis     = diagnosis;
        if (treatment)     record.treatment     = treatment;
        if (medications)   record.medications   = medications;
        if (notes)         record.notes         = notes;
        if (integrityHash) record.integrityHash = integrityHash;

        await record.save();
        res.json(record);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Soft-delete a record (GDPR right-to-erasure support) — admin only
exports.deleteRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.recordId);
        if (!record || record.deletedAt) {
            return res.status(404).json({ msg: 'Record not found' });
        }

        record.deletedAt = new Date();
        await record.save();

        res.json({ msg: 'Record deleted (soft)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Export patient data (GDPR right to data portability)
exports.exportPatientData = async (req, res) => {
    const { patientId } = req.params;

    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const records = await MedicalRecord.find({ patient: patientId, deletedAt: null })
            .populate('doctor', 'name email');

        res.json({ patientId, exportedAt: new Date().toISOString(), records });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};