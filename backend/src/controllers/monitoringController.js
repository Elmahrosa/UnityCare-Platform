const os = require('os');
const mongoose = require('mongoose');

exports.getSystemHealth = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    ok: true,
    service: 'Unity Care Hospital API',
    version: '1.0.0',
    uptime: process.uptime(),
    database: dbStatus[dbState] || 'unknown',
    memory: {
      free: os.freemem(),
      total: os.totalmem(),
      usagePercent: Math.round((1 - os.freemem() / os.totalmem()) * 100),
    },
    cpu: {
      loadAvg: os.loadavg(),
      cores: os.cpus().length,
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};

exports.getMetrics = async (req, res) => {
  const totalUsers = await mongoose.model('User').countDocuments();
  const totalAppointments = await mongoose.model('Appointment').countDocuments();
  const totalRecords = await mongoose.model('MedicalRecord').countDocuments({ deletedAt: null });
  const carePlans = await mongoose.model('CarePlan').countDocuments({ deletedAt: null, status: 'active' });

  const appointmentsByStatus = await mongoose.model('Appointment').aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusBreakdown = {};
  appointmentsByStatus.forEach(s => { statusBreakdown[s._id] = s.count; });

  res.json({
    ok: true,
    metrics: {
      totalUsers,
      totalAppointments,
      totalMedicalRecords: totalRecords,
      activeCarePlans: carePlans,
      appointmentStatusBreakdown: statusBreakdown,
    },
    timestamp: new Date().toISOString(),
  });
};
