const mongoose = require('mongoose');

// Database configuration function
const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salma_unity_care_hospital';

        // ✅ FIX: removed deprecated options: useCreateIndex, useFindAndModify
        // These were removed in Mongoose 6+ and throw errors if passed
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // ✅ ADDED: connection event listeners for runtime monitoring
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting reconnect...');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB runtime error:', err.message);
        });

        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;