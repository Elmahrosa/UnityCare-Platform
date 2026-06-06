const mongoose = require('mongoose');

const deviceReadingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceType: {
    type: String,
    required: true,
    trim: true,
  },
  deviceId: {
    type: String,
    required: true,
    trim: true,
  },
  metric: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  unit: {
    type: String,
    trim: true,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

deviceReadingSchema.index({ patient: 1, recordedAt: -1 });
deviceReadingSchema.index({ deviceId: 1, recordedAt: -1 });

module.exports = mongoose.model('DeviceReading', deviceReadingSchema);
