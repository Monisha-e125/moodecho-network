const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new AppError('Too many requests, please try again later', 429);
  }
});

// Strict limiter for authentication endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes',
  handler: (req, res) => {
    throw new AppError('Too many authentication attempts', 429);
  }
});

// Mood logging limiter (prevent spam)
exports.moodLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 moods per minute
  message: 'Please slow down mood logging',
  handler: (req, res) => {
    throw new AppError('Too many moods logged too quickly', 429);
  }
});

// Walk creation limiter
exports.walkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 walks per hour
  message: 'Walk creation limit reached',
  handler: (req, res) => {
    throw new AppError('Too many walks created, please wait', 429);
  }
});