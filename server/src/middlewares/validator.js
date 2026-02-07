const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation middleware wrapper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join('. ');
    return next(new AppError(errorMessages, 400));
  }
  next();
};

// Registration validation
exports.validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  validate
];

// Login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

// Mood logging validation
exports.validateMoodLog = [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required'),
  
  body('moodScore')
    .isInt({ min: 1, max: 10 })
    .withMessage('Mood score must be between 1 and 10'),
  
  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Note must be less than 500 characters')
    .trim(),
  
  validate
];

// Change password validation
exports.validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
  
  validate
];