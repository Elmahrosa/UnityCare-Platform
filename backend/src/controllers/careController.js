const CarePlan = require('../models/CarePlan');
const User = require('../models/User');

exports.getPlans = async (req, res) => {
  try {
    const filter = { deletedAt: null };
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const plans = await CarePlan.find(filter)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ createdAt: -1 });

    res.json({ ok: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { patientId, diagnosis, goals, medications, instructions } = req.body;

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({ success: false, message: 'Invalid patient' });
    }

    const plan = await CarePlan.create({
      patient: patientId,
      doctor: req.user._id,
      diagnosis,
      goals: goals || [],
      medications: medications || [],
      instructions,
    });

    res.status(201).json({ ok: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const allowed = ['diagnosis', 'goals', 'medications', 'instructions', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const plan = await CarePlan.findOneAndUpdate(
      { _id: req.params.planId, deletedAt: null },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Care plan not found' });
    }

    res.json({ ok: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await CarePlan.findOneAndUpdate(
      { _id: req.params.planId, deletedAt: null },
      { $set: { deletedAt: new Date(), status: 'cancelled' } },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Care plan not found' });
    }

    res.json({ ok: true, message: 'Care plan deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
