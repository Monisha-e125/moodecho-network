const User = require('../models/User');
const Mood = require('../models/Mood');
const MoodWalk = require('../models/MoodWalk');
const logger = require('../utils/logger');

/**
 * Create all database indexes for optimal query performance
 */
async function createIndexes() {
  try {
    logger.info('Creating database indexes...');

    // ============================================
    // USER INDEXES
    // ============================================
    
    // Email - unique, most common login query
    await User.collection.createIndex(
      { email: 1 }, 
      { unique: true, name: 'idx_user_email' }
    );

    // Username - unique, for profile lookups
    await User.collection.createIndex(
      { username: 1 }, 
      { unique: true, name: 'idx_user_username' }
    );

    // Active users - for matching queries
    await User.collection.createIndex(
      { isActive: 1, 'stats.totalMoods': -1 }, 
      { name: 'idx_user_active_moods' }
    );

    // Created at - for analytics
    await User.collection.createIndex(
      { createdAt: -1 }, 
      { name: 'idx_user_created' }
    );

    logger.info('✓ User indexes created');

    // ============================================
    // MOOD INDEXES
    // ============================================

    // User + Timestamp - most common query (get user's moods)
    await Mood.collection.createIndex(
      { userId: 1, timestamp: -1 }, 
      { name: 'idx_mood_user_time' }
    );

    // User + Sentiment - for pattern analysis
    await Mood.collection.createIndex(
      { userId: 1, sentiment: 1 }, 
      { name: 'idx_mood_user_sentiment' }
    );

    // User + Day of Week - for weekly patterns
    await Mood.collection.createIndex(
      { userId: 1, dayOfWeek: 1 }, 
      { name: 'idx_mood_user_day' }
    );

    // Timestamp only - for global analytics
    await Mood.collection.createIndex(
      { timestamp: -1 }, 
      { name: 'idx_mood_timestamp' }
    );

    // Anomaly detection queries
    await Mood.collection.createIndex(
      { userId: 1, isAnomaly: 1, timestamp: -1 }, 
      { name: 'idx_mood_anomaly' }
    );

    logger.info('✓ Mood indexes created');

    // ============================================
    // MOODWALK INDEXES
    // ============================================

    // Participants - for finding user's walks
    await MoodWalk.collection.createIndex(
      { 'participants.userId': 1 }, 
      { name: 'idx_walk_participants' }
    );

    // Status - for active walk queries
    await MoodWalk.collection.createIndex(
      { status: 1, createdAt: -1 }, 
      { name: 'idx_walk_status' }
    );

    // Created at - for history
    await MoodWalk.collection.createIndex(
      { createdAt: -1 }, 
      { name: 'idx_walk_created' }
    );

    // Completed walks - for stats
    await MoodWalk.collection.createIndex(
      { status: 1, completedAt: -1 }, 
      { name: 'idx_walk_completed' }
    );

    // Compound: User + Status - for user's active walks
    await MoodWalk.collection.createIndex(
      { 'participants.userId': 1, status: 1 }, 
      { name: 'idx_walk_user_status' }
    );

    logger.info('✓ MoodWalk indexes created');

    // ============================================
    // VERIFY INDEXES
    // ============================================

    const userIndexes = await User.collection.indexes();
    const moodIndexes = await Mood.collection.indexes();
    const walkIndexes = await MoodWalk.collection.indexes();

    logger.info(`Total indexes created:
      - Users: ${userIndexes.length}
      - Moods: ${moodIndexes.length}
      - Walks: ${walkIndexes.length}
    `);

    return {
      success: true,
      indexes: {
        users: userIndexes.length,
        moods: moodIndexes.length,
        walks: walkIndexes.length
      }
    };

  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * Drop all custom indexes (for development/testing)
 */
async function dropIndexes() {
  try {
    logger.warn('Dropping all custom indexes...');

    await User.collection.dropIndexes();
    await Mood.collection.dropIndexes();
    await MoodWalk.collection.dropIndexes();

    logger.info('✓ All indexes dropped');
  } catch (error) {
    logger.error('Error dropping indexes:', error);
    throw error;
  }
}

module.exports = { createIndexes, dropIndexes };