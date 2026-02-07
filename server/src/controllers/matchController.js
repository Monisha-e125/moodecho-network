const matchingService = require('../services/matchingService');
const { AppError } = require('../middlewares/errorHandler');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Find a mood match for the current user
 */
exports.findMatch = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const result = await matchingService.findMoodMatch(userId);

  res.json({
    status: 'success',
    data: result
  });
});

/**
 * Get compatibility analysis with a specific user
 */
exports.getCompatibility = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { targetUserId } = req.params;

  // Validate target user exists
  if (!targetUserId) {
    return next(new AppError('Target user ID is required', 400));
  }

  // Don't allow matching with yourself
  if (userId.toString() === targetUserId) {
    return next(new AppError('Cannot match with yourself', 400));
  }

  const analysis = await matchingService.getCompatibilityAnalysis(
    userId,
    targetUserId
  );

  if (analysis.error) {
    return next(new AppError(analysis.error, 400));
  }

  res.json({
    status: 'success',
    data: {
      analysis
    }
  });
});

/**
 * Get user's mood profile
 */
exports.getMyProfile = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const profile = await matchingService.getUserMoodProfile(userId);

  if (!profile) {
    return res.json({
      status: 'success',
      data: {
        message: 'Log at least 3 moods in the past week to generate your profile',
        profile: null
      }
    });
  }

  res.json({
    status: 'success',
    data: {
      profile: {
        avgMood: profile.avgMood,
        dominantSentiment: profile.dominantSentiment,
        dayAverages: profile.dayAverages,
        totalEntries: profile.totalEntries,
        recentEmojis: profile.recentEmojis,
        moodRange: profile.moodRange
      }
    }
  });
});

/**
 * Get match history for user
 */
exports.getMatchHistory = catchAsync(async (req, res, next) => {
  // This will be implemented in Phase 5 when we add MoodWalk model
  // For now, return placeholder
  res.json({
    status: 'success',
    data: {
      message: 'Match history will be available after Phase 5',
      matches: []
    }
  });
});