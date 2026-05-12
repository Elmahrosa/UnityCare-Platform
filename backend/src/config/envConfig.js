const dotenv = require('dotenv');

const loadEnvVariables = () => {
    // In production, variables should be injected by the platform, not a .env file
    if (process.env.NODE_ENV !== 'production') {
        const result = dotenv.config();
        if (result.error) {
            console.warn('No .env file found, using environment variables directly.');
        }
    }
};

const validateEnvVariables = () => {
    const required = [
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'NODE_ENV',
    ];

    // ✅ ADDED: warn about recommended vars rather than crashing on them
    const recommended = [
        'JWT_REFRESH_SECRET',
        'JWT_EXPIRES_IN',
        'CORS_ORIGIN',
        'ML_API_URL',
    ];

    const missing = required.filter(v => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    const missingRecommended = recommended.filter(v => !process.env[v]);
    if (missingRecommended.length > 0) {
        console.warn(`⚠️  Recommended env vars not set: ${missingRecommended.join(', ')}`);
    }

    // ✅ ADDED: security check — warn if JWT_SECRET is too short
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  JWT_SECRET should be at least 32 characters for production security.');
    }

    console.log('Environment configuration validated.');
};

module.exports = { loadEnvVariables, validateEnvVariables };