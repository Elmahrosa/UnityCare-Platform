const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/dbConfig');
const { loadEnvVariables, validateEnvVariables } = require('./config/envConfig');
const { requestLogger, errorLogger } = require('./utils/logger');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes             = require('./routes/authRoutes');
const userRoutes             = require('./routes/userRoutes');
const appointmentRoutes      = require('./routes/appointmentRoutes');
const medicalRecordRoutes    = require('./routes/medicalRecordRoutes');
const analyticsRoutes        = require('./routes/analyticsRoutes');
const blockchainRoutes       = require('./routes/blockchainRoutes');
const careOrchestrationRoutes = require('./routes/careOrchestrationRoutes');
const chatbotRoutes          = require('./routes/chatbotRoutes');
const iotRoutes              = require('./routes/iotRoutes');
const monitoringRoutes       = require('./routes/monitoringRoutes');

const app = express();

// ── Boot sequence ─────────────────────────────────────────────────────────────
loadEnvVariables();
validateEnvVariables();
connectDB();

// ── Rate limiters ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many authentication attempts.' },
});

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({
        status:      'ok',
        service:     'Unity Care Hospital API',
        version:     '1.0.0',
        timestamp:   new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/records',       medicalRecordRoutes);   // ← NEW
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/blockchain',    blockchainRoutes);
app.use('/api/care',          careOrchestrationRoutes);
app.use('/api/chatbot',       chatbotRoutes);
app.use('/api/iot',           iotRoutes);
app.use('/api/monitoring',    monitoringRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ── Error pipeline ────────────────────────────────────────────────────────────
app.use(errorLogger);

// Express requires exactly 4 params for error-handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`UCH API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM — shutting down gracefully...');
    server.close(() => process.exit(0));
});

module.exports = app;