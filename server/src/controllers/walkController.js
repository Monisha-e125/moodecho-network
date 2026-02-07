const MoodWalk = require('../models/MoodWalk');
const User = require('../models/User');
const matchingService = require('../services/matchingService');
const walkService = require('../services/walkService');
const { AppError } = require('../middlewares/errorHandler');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Create a new mood walk (find match and generate walk)
 */
exports.createWalk = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Find a compatible match
  const matchResult = await matchingService.findMoodMatch(userId);

  if (!matchResult.matched) {
    return res.json({
      status: 'success',
      data: {
        walkCreated: false,
        message: matchResult.message
      }
    });
  }

  // Get both users' profiles
  const userProfile = await matchingService.getUserMoodProfile(userId);
  const matchProfile = await matchingService.getUserMoodProfile(matchResult.match.userId);

  // Generate walk configuration
  const walkConfig = walkService.generateWalk(
    userProfile,
    matchProfile,
    matchResult.match.compatibilityScore
  );

  // Create mood walk
  const walk = await MoodWalk.create({
    participants: [
      {
        userId: userId,
        username: req.user.username
      },
      {
        userId: matchResult.match.userId,
        username: matchResult.match.username
      }
    ],
    theme: walkConfig.theme,
    ambience: walkConfig.ambience,
    duration: walkConfig.duration,
    compatibilityScore: walkConfig.compatibilityScore,
    status: 'waiting'
  });

  // Generate checkpoints
  const checkpoints = walkService.generateCheckpoints(walk.duration, walk.theme);

  logger.info(`Mood walk created: ${walk._id} for users ${req.user.username} and ${matchResult.match.username}`);

  res.status(201).json({
    status: 'success',
    data: {
      walkCreated: true,
      walk: {
        id: walk._id,
        theme: walk.theme,
        description: walk.ambience.description,
        duration: walk.duration,
        compatibilityScore: walk.compatibilityScore,
        partner: {
          username: matchResult.match.username,
          profile: matchResult.match.profile
        },
        ambience: {
          sounds: walk.ambience.sounds,
          visualElements: walk.ambience.visualElements,
          colorPalette: walk.ambience.colorPalette,
          intensity: walk.ambience.intensity,
          tempo: walk.ambience.tempo
        },
        checkpoints,
        status: walk.status
      }
    }
  });
});

/**
 * Start a mood walk
 */
exports.startWalk = catchAsync(async (req, res, next) => {
  const { walkId } = req.params;
  const userId = req.user._id;

  const walk = await MoodWalk.findById(walkId);

  if (!walk) {
    return next(new AppError('Walk not found', 404));
  }

  // Check if user is a participant
  const isParticipant = walk.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this walk', 403));
  }

  // Update walk status
  walk.status = 'active';
  walk.startedAt = new Date();
  await walk.save();

  // Emit socket event (will be implemented in Phase 6)
  const io = req.app.get('io');
  if (io) {
    io.to(`walk-${walkId}`).emit('walk-started', {
      walkId: walk._id,
      startedBy: req.user.username,
      startedAt: walk.startedAt
    });
  }

  logger.info(`Mood walk started: ${walkId} by ${req.user.username}`);

  res.json({
    status: 'success',
    data: {
      walk: {
        id: walk._id,
        status: walk.status,
        startedAt: walk.startedAt,
        duration: walk.duration
      }
    }
  });
});

/**
 * Complete a mood walk with feedback
 */
exports.completeWalk = catchAsync(async (req, res, next) => {
  const { walkId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const walk = await MoodWalk.findById(walkId);

  if (!walk) {
    return next(new AppError('Walk not found', 404));
  }

  // Check if user is a participant
  const isParticipant = walk.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this walk', 403));
  }

  // Add feedback
  walk.feedback.push({
    userId,
    rating,
    comment
  });

  // If both participants have given feedback, mark as completed
  if (walk.feedback.length === walk.participants.length) {
    walk.status = 'completed';
    walk.completedAt = new Date();

    // Update user stats
    await User.updateMany(
      { _id: { $in: walk.participants.map(p => p.userId) } },
      { $inc: { 'stats.moodWalksCompleted': 1 } }
    );
  }

  await walk.save();

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`walk-${walkId}`).emit('walk-feedback', {
      walkId: walk._id,
      username: req.user.username,
      rating
    });
  }

  logger.info(`Feedback submitted for walk ${walkId} by ${req.user.username}`);

  res.json({
    status: 'success',
    data: {
      walk: {
        id: walk._id,
        status: walk.status,
        feedbackCount: walk.feedback.length,
        completed: walk.status === 'completed'
      }
    }
  });
});

/**
 * Get walk history for user
 */
exports.getWalkHistory = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const walks = await MoodWalk.find({
    'participants.userId': userId
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await MoodWalk.countDocuments({
    'participants.userId': userId
  });

  res.json({
    status: 'success',
    data: {
      walks: walks.map(walk => ({
        id: walk._id,
        theme: walk.theme,
        duration: walk.duration,
        compatibilityScore: walk.compatibilityScore,
        status: walk.status,
        createdAt: walk.createdAt,
        completedAt: walk.completedAt,
        partner: walk.participants.find(
          p => p.userId.toString() !== userId.toString()
        )?.username,
        myFeedback: walk.feedback.find(
          f => f.userId.toString() === userId.toString()
        )
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Get single walk details
 */
exports.getWalk = catchAsync(async (req, res, next) => {
  const { walkId } = req.params;
  const userId = req.user._id;

  const walk = await MoodWalk.findById(walkId);

  if (!walk) {
    return next(new AppError('Walk not found', 404));
  }

  // Check if user is a participant
  const isParticipant = walk.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this walk', 403));
  }

  // Generate checkpoints
  const checkpoints = walkService.generateCheckpoints(walk.duration, walk.theme);

  res.json({
    status: 'success',
    data: {
      walk: {
        id: walk._id,
        theme: walk.theme,
        description: walk.ambience.description,
        duration: walk.duration,
        compatibilityScore: walk.compatibilityScore,
        participants: walk.participants,
        ambience: walk.ambience,
        checkpoints,
        status: walk.status,
        startedAt: walk.startedAt,
        completedAt: walk.completedAt,
        feedback: walk.feedback,
        createdAt: walk.createdAt
      }
    }
  });
});

/**
 * Get walk recommendations
 */
exports.getRecommendations = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const recommendations = await walkService.getWalkRecommendations(userId);

  res.json({
    status: 'success',
    data: recommendations
  });
});

/**
 * Abandon a walk
 */
exports.abandonWalk = catchAsync(async (req, res, next) => {
  const { walkId } = req.params;
  const userId = req.user._id;

  const walk = await MoodWalk.findById(walkId);

  if (!walk) {
    return next(new AppError('Walk not found', 404));
  }

  // Check if user is a participant
  const isParticipant = walk.participants.some(
    p => p.userId.toString() === userId.toString()
  );

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this walk', 403));
  }

  walk.status = 'abandoned';
  await walk.save();

  logger.info(`Walk abandoned: ${walkId} by ${req.user.username}`);

  res.json({
    status: 'success',
    data: {
      message: 'Walk abandoned'
    }
  });
});