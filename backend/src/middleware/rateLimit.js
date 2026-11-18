const rateLimit = require('express-rate-limit');

// NFR-SEC-001: max 20 requests / 15 min / IP on /api/auth/*
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});
