const Appointment = require('../models/Appointment');
// ✅ FIX: Original imported Sequelize and called .findAll() on a Mongoose model — would crash at runtime.
// Replaced with proper Mongoose aggregation pipeline.

// Fetch health trends (appointment volume over time)
exports.getHealthTrends = async (req, res) => {
    const { startDate, endDate, limit = 30, offset = 0 } = req.query;

    try {
        const matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        // ✅ FIX: proper Mongoose aggregation instead of Sequelize's findAll
        const trends = await Appointment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    count: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } },
            { $skip: parseInt(offset) },
            { $limit: parseInt(limit) },
        ]);

        const labels = trends.map(t => t._id);
        const values = trends.map(t => t.count);

        // ✅ ADDED: graceful handling if ML API is unavailable
        let predictions = null;
        if (process.env.ML_API_URL) {
            try {
                const axios = require('axios');
                const predictionResponse = await axios.post(
                    `${process.env.ML_API_URL}/predict`,
                    { labels, values },
                    { timeout: 5000 }
                );
                predictions = predictionResponse.data;
            } catch (mlErr) {
                console.warn('ML API unavailable, skipping predictions:', mlErr.message);
            }
        }

        res.json({ labels, values, predictions });
    } catch (error) {
        console.error('Error fetching health trends:', error);
        res.status(500).json({ error: 'An error occurred while fetching health trends.' });
    }
};

// ✅ ADDED: appointment status breakdown dashboard stats
exports.getAppointmentStats = async (req, res) => {
    try {
        const stats = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = stats.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
        }, {});

        res.json(result);
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        res.status(500).json({ error: 'Error fetching appointment stats.' });
    }
};