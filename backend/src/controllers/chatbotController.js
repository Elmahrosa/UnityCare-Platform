const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.triage = async (req, res) => {
  try {
    const { symptom, urgency } = req.body;

    if (!symptom) {
      return res.status(400).json({ success: false, message: 'Symptom description required' });
    }

    const triageLevel = urgency === 'emergency' ? 'immediate'
      : urgency === 'moderate' ? 'soon'
      : 'routine';

    const availableDoctors = await User.find({
      role: 'doctor',
    }).select('name email').limit(5);

    res.json({
      ok: true,
      triageLevel,
      recommendation: triageLevel === 'immediate'
        ? 'Please visit the emergency department immediately.'
        : `Schedule an appointment with a specialist within ${triageLevel === 'soon' ? '24 hours' : '1 week'}.`,
      availableDoctors: availableDoctors.map(d => ({
        id: d._id,
        name: d.name,
        email: d.email,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.suggestAppointment = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const existing = await Appointment.find({
      doctor: doctorId,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: new Date() },
    }).sort({ date: 1, time: 1 }).limit(5);

    const slots = existing.map(a => ({
      date: a.date,
      time: a.time,
      status: a.status,
    }));

    res.json({ ok: true, existingAppointments: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
