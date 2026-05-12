// Minimal logger middleware to avoid missing-module crashes.
// Replace with Winston/Pino later if desired.

function requestLogger(req, _res, next) {
  // Lightweight structured log
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl
  }));
  next();
}

function errorLogger(err, _req, _res, next) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({
    t: new Date().toISOString(),
    level: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }));
  next(err);
}

module.exports = { requestLogger, errorLogger };