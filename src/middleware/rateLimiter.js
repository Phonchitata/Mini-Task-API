// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,            // 1 นาที
  max: 30,                        // 30 req/นาที/ไอพี
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' }
  }
});

module.exports = limiter;
