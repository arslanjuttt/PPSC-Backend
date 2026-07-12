const rateLimit = require('express-rate-limit');

const rateLimitResponse = {
  success: false,
  message: 'Too many requests, please try again later',
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

module.exports = { authLimiter, strictAuthLimiter };
