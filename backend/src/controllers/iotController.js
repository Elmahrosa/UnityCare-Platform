const DeviceReading = require('../models/DeviceReading');

exports.getReadings = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { metric, limit: queryLimit = 50 } = req.query;

    const filter = { patient: patientId };
    if (metric) filter.metric = metric;

    const readings = await DeviceReading.find(filter)
      .sort({ recordedAt: -1 })
      .limit(parseInt(queryLimit, 10) || 50);

    res.json({ ok: true, readings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordReading = async (req, res) => {
  try {
    const { deviceType, deviceId, metric, value, unit, recordedAt } = req.body;

    if (!deviceType || !deviceId || !metric || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'deviceType, deviceId, metric, and value are required',
      });
    }

    const reading = await DeviceReading.create({
      patient: req.params.patientId,
      deviceType,
      deviceId,
      metric,
      value,
      unit,
      recordedAt: recordedAt || new Date(),
    });

    res.status(201).json({ ok: true, reading });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLatestVitals = async (req, res) => {
  try {
    const { patientId } = req.params;

    const vitalMetrics = ['heart_rate', 'blood_pressure', 'temperature', 'oxygen_saturation', 'respiratory_rate'];
    const latest = {};

    for (const metric of vitalMetrics) {
      const reading = await DeviceReading.findOne({
        patient: patientId,
        metric,
      }).sort({ recordedAt: -1 });

      if (reading) {
        latest[metric] = {
          value: reading.value,
          unit: reading.unit,
          recordedAt: reading.recordedAt,
          deviceId: reading.deviceId,
        };
      }
    }

    res.json({ ok: true, vitals: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
