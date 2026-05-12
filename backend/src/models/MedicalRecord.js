const mongoose = require('mongoose');

/**
 * MedicalRecord — complete patient clinical record.
 * Referenced in DUE_DILIGENCE_DEFENSE as "Secure records storage".
 */
const medicalRecordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    diagnosis: {
        type: String,
        required: true,
        trim: true,
    },
    treatment: {
        type: String,
        required: true,
        trim: true,
    },
    medications: [{
        name:      { type: String, required: true },
        dosage:    { type: String, required: true },
        frequency: { type: String, required: true },
        duration:  { type: String },
    }],
    notes: {
        type: String,
        trim: true,
    },
    // Attachments: lab results, imaging URLs, etc.
    attachments: [{
        filename:   { type: String },
        url:        { type: String },
        uploadedAt: { type: Date, default: Date.now },
    }],
    // Optional: integrity hash for blockchain attestation layer
    integrityHash: {
        type: String,
        trim: true,
    },
    // Soft-delete support for GDPR right-to-erasure
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Index for fast patient record lookups
medicalRecordSchema.index({ patient: 1, createdAt: -1 });

// Auto-update updatedAt via timestamps option above

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);