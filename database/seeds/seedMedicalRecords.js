const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salma_unity_care_hospital';

const records = [
  {
    diagnosis: 'Type 2 Diabetes Mellitus',
    treatment: 'Metformin 500mg twice daily, dietary modification, exercise plan',
    medications: [
      { name: 'Metformin', dosage: '500mg', frequency: 'twice daily', duration: 'ongoing' },
    ],
    notes: 'Patient presented with elevated fasting glucose. HbA1c: 7.2%. Lifestyle counseling provided.',
  },
  {
    diagnosis: 'Hypertension',
    treatment: 'Lisinopril 10mg daily, low-sodium diet, regular BP monitoring',
    medications: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily', duration: 'ongoing' },
    ],
    notes: 'BP: 145/95 at diagnosis. Follow-up in 4 weeks.',
  },
  {
    diagnosis: 'Seasonal Allergic Rhinitis',
    treatment: 'Cetirizine 10mg daily as needed, avoid known triggers',
    medications: [
      { name: 'Cetirizine', dosage: '10mg', frequency: 'once daily PRN', duration: 'as needed' },
    ],
    notes: 'Patient reports symptoms during spring season. Prescribed antihistamine.',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const medicalRecordSchema = new mongoose.Schema({
      patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      diagnosis: String,
      treatment: String,
      medications: [{
        name: String, dosage: String, frequency: String, duration: String,
      }],
      notes: String,
      integrityHash: String,
      deletedAt: { type: Date, default: null },
    }, { timestamps: true });

    const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String,
    }));

    const patient = await User.findOne({ role: 'patient' });
    const doctor = await User.findOne({ role: 'doctor' });

    if (!patient || !doctor) {
      console.error('Run seedUsers.js first to create users');
      await mongoose.disconnect();
      return;
    }

    await MedicalRecord.deleteMany({});
    console.log('Cleared existing records');

    for (const r of records) {
      const integrityHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          diagnosis: r.diagnosis,
          treatment: r.treatment,
          medications: r.medications,
          patient: patient._id.toString(),
        }))
        .digest('hex');

      await MedicalRecord.create({
        patient: patient._id,
        doctor: doctor._id,
        ...r,
        integrityHash,
      });
      console.log(`Created record: ${r.diagnosis}`);
    }

    console.log(`\nSeeded ${records.length} medical records for patient: ${patient.name}`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
