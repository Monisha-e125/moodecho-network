const Mood = require('../models/Mood');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { AppError } = require('../middlewares/errorHandler');
const { catchAsync } = require('../middlewares/errorHandler');
const { getTimeOfDay, getPaginationData } = require('../utils/helpers');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

// Replace existing getMoodStats function
exports.getMoodStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Use cache service
  const stats = await cacheService.getMoodStats(userId, async () => {
    // Original stats logic here
    const moods = await Mood.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    if (moods.length === 0) {
      return {
        stats: { avgMood: 0, totalEntries: 0, emojiDistribution: {} },
        weekPattern: [],
        prediction: null,
        insights: null
      };
    }

    // Calculate stats
    const avgMood = moods.reduce((sum, m) => sum + m.moodScore, 0) / moods.length;
    const emojiDistribution = moods.reduce((acc, m) => {
      acc[m.emoji] = (acc[m.emoji] || 0) + 1;
      return acc;
    }, {});

    const weekPattern = await aiService.detectWeeklyPattern(userId);
    const prediction = await aiService.predictMoodTrend(userId);
    const insights = await aiService.getMoodInsights(userId);

    return {
      stats: {
        avgMood: roundTo(avgMood, 1),
        totalEntries: moods.length,
        emojiDistribution
      },
      weekPattern,
      prediction,
      insights
    };
  });
 res.json({
    status: 'success',
    data: stats
  });
});
  
// Log a new mood
exports.logMood = catchAsync(async (req, res, next) => {
  const { emoji, moodScore, note, tags, context } = req.body;
  const userId = req.user._id;

  // Analyze sentiment if note provided
  let sentimentData = { type: 'neutral' };
  if (note) {
    sentimentData = aiService.analyzeSentiment(note);
  }

  // Detect weekly pattern
  const weekPattern = await aiService.detectWeeklyPattern(userId);

  // Get user's average mood for anomaly detection
  const userMoods = await Mood.find({ userId }).select('moodScore');
  const avgMood = userMoods.length 
    ? userMoods.reduce((sum, m) => sum + m.moodScore, 0) / userMoods.length
    : moodScore;

  // Create mood entry
  const mood = await Mood.create({
    userId,
    emoji,
    moodScore,
    note,
    tags: tags || [],
    context: {
      timeOfDay: context?.timeOfDay || getTimeOfDay(),
      weather: context?.weather,
      location: context?.location
    },
    sentiment: sentimentData.type,
    weekPattern,
    isAnomaly: aiService.isAnomalousEntry(moodScore, avgMood)
  });

  // Update user stats
  await User.findByIdAndUpdate(userId, {
    $inc: { 'stats.totalMoods': 1 },
    'moodProfile.lastAnalyzed': new Date()
  });

  // Get prediction
  const prediction = await aiService.predictMoodTrend(userId);

  logger.info(`Mood logged by user: ${req.user.username}`);

  res.status(201).json({
    status: 'success',
    data: {
      mood,
      analysis: {
        weekPattern,
        prediction,
        isAnomaly: mood.isAnomaly,
        sentiment: sentimentData
      }
    }
  });
});

// Get mood history
exports.getMoodHistory = catchAsync(async (req, res, next) => {
  const { days = 30, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const moods = await Mood.find({
    userId,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Mood.countDocuments({
    userId,
    timestamp: { $gte: startDate }
  });

  res.json({
    status: 'success',
    data: {
      moods,
      pagination: getPaginationData(page, limit, total)
    }
  });
});

// Get mood statistics
exports.getMoodStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Aggregate statistics
  const stats = await Mood.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        avgMood: { $avg: '$moodScore' },
        totalEntries: { $sum: 1 },
        moods: { $push: '$$ROOT' }
      }
    }
  ]);

  if (!stats.length) {
    return res.json({
      status: 'success',
      data: {
        stats: {
          avgMood: 0,
          totalEntries: 0
        },
        weekPattern: [],
        prediction: { message: 'No mood data yet' },
        insights: { message: 'Start logging moods to see insights!' }
      }
    });
  }

  // Get pattern and prediction
  const weekPattern = await aiService.detectWeeklyPattern(userId);
  const prediction = await aiService.predictMoodTrend(userId);
  const insights = await aiService.getMoodInsights(userId);

  // Emoji distribution
  const emojiCounts = {};
  stats[0].moods.forEach(mood => {
    emojiCounts[mood.emoji] = (emojiCounts[mood.emoji] || 0) + 1;
  });

  res.json({
    status: 'success',
    data: {
      stats: {
        avgMood: Math.round(stats[0].avgMood * 10) / 10,
        totalEntries: stats[0].totalEntries,
        emojiDistribution: emojiCounts
      },
      weekPattern,
      prediction,
      insights
    }
  });
});

// Get single mood entry
exports.getMood = catchAsync(async (req, res, next) => {
  const mood = await Mood.findById(req.params.id);

  if (!mood) {
    return next(new AppError('Mood not found', 404));
  }

  // Check if mood belongs to user
  if (mood.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to access this mood', 403));
  }

  res.json({
    status: 'success',
    data: {
      mood
    }
  });
});

// Delete mood entry
exports.deleteMood = catchAsync(async (req, res, next) => {
  const mood = await Mood.findById(req.params.id);

  if (!mood) {
    return next(new AppError('Mood not found', 404));
  }

  // Check if mood belongs to user
  if (mood.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete this mood', 403));
  }

  await mood.deleteOne();

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalMoods': -1 }
  });

  logger.info(`Mood deleted by user: ${req.user.username}`);

  res.status(204).json({
    status: 'success',
    data: null
  });
});