const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Generate JWT token
const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Create and send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        stats: user.stats
      }
    }
  });
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  const { email, username, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email already registered', 400));
    }
    return next(new AppError('Username already taken', 400));
  }

  // Create new user
  const user = await User.create({
    email,
    username,
    password
  });

  logger.info(`New user registered: ${username}`);

  createSendToken(user, 201, res);
});

// Login existing user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.username}`);

  createSendToken(user, 200, res);
});

// Get current user profile
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update user profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { username } = req.body;

  // Don't allow password or email updates through this endpoint
  if (req.body.password || req.body.email) {
    return next(new AppError('This route is not for password/email updates', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { username },
    { new: true, runValidators: true }
  );

  res.json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Change password
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.username}`);

  createSendToken(user, 200, res);
});