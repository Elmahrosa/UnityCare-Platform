const mongoose = require('mongoose');

const carePlanSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  goals: [{
    description: { type: String, required: true },
    targetDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'achieved', 'cancelled'],
      default: 'pending',
    },
  }],
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
  }],
  instructions: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on_hold', 'cancelled'],
    default: 'active',
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

carePlanSchema.index({ patient: 1, status: 1 });
carePlanSchema.index({ doctor: 1, status: 1 });

module.exports = mongoose.model('CarePlan', carePlanSchema);
