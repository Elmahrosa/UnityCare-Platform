const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salma_unity_care_hospital';

const users = [
  {
    name: 'Admin User',
    email: 'admin@unitycare.health',
    password: 'Admin@123456',
    role: 'admin',
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@unitycare.health',
    password: 'Doctor@123456',
    role: 'doctor',
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@unitycare.health',
    password: 'Doctor@123456',
    role: 'doctor',
  },
  {
    name: 'John Patient',
    email: 'john.patient@example.com',
    password: 'Patient@123456',
    role: 'patient',
  },
  {
    name: 'Jane Patient',
    email: 'jane.patient@example.com',
    password: 'Patient@123456',
    role: 'patient',
  },
  {
    name: 'Nurse Alice',
    email: 'alice.nurse@unitycare.health',
    password: 'Nurse@123456',
    role: 'nurse',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      createdAt: { type: Date, default: Date.now },
    }));

    await User.deleteMany({});
    console.log('Cleared existing users');

    for (const u of users) {
      u.password = await bcrypt.hash(u.password, 12);
      await User.create(u);
      console.log(`Created user: ${u.email} (${u.role})`);
    }

    console.log('\nSeed complete!');
    console.log('Login credentials:');
    users.forEach(u => console.log(`  ${u.role}: ${u.email} / ${u.password}`));
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
