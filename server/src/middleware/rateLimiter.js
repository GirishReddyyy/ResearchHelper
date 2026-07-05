const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes
    max: max || 100,
    message: {
      error: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = createRateLimiter;
