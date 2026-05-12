const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
// ✅ FIX: duplicate require block at top of original file removed

// Create a new appointment
exports.createAppointment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { date, time, patientId, doctorId, notes } = req.body;

    try {
        const patient = await User.findById(patientId);
        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        const doctor = await User.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        // ✅ ADDED: ensure doctor has correct role
        if (doctor.role !== 'doctor') {
            return res.status(400).json({ msg: 'Specified user is not a doctor' });
        }

        // ✅ ADDED: check for conflicting appointment slot
        const conflict = await Appointment.findOne({
            doctor: doctorId,
            date,
            time,
            status: { $in: ['pending', 'confirmed'] }
        });
        if (conflict) {
            return res.status(409).json({ msg: 'Doctor already has an appointment at this time' });
        }

        const appointment = new Appointment({
            date,
            time,
            patient: patientId,
            doctor: doctorId,
            notes,
        });

        await appointment.save();
        res.status(201).json(appointment);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all appointments for a specific patient
exports.getAppointmentsByPatient = async (req, res) => {
    const { patientId } = req.params;

    // ✅ ADDED: authorization check — patients can only see their own appointments
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const appointments = await Appointment.find({ patient: patientId })
            .populate('doctor', 'name email')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get all appointments for a specific doctor
exports.getAppointmentsByDoctor = async (req, res) => {
    const { doctorId } = req.params;

    // ✅ ADDED: authorization check
    if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
        return res.status(403).json({ msg: 'Access denied' });
    }

    try {
        const appointments = await Appointment.find({ doctor: doctorId })
            .populate('patient', 'name email')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update an appointment
exports.updateAppointment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { appointmentId } = req.params;
    const { date, time, notes, status } = req.body;

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        if (date) appointment.date = date;
        if (time) appointment.time = time;
        if (notes) appointment.notes = notes;
        if (status) appointment.status = status;

        await appointment.save();
        res.json(appointment);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Delete an appointment
exports.deleteAppointment = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // ✅ FIX: .remove() was deprecated in Mongoose 6, removed in 8
        // Use deleteOne() instead
        await Appointment.deleteOne({ _id: appointmentId });
        res.json({ msg: 'Appointment deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};