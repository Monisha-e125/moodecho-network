const User = require('../models/User');
const logger = require('../utils/logger');

class StreakService {
  
  /**
   * Update user's streak when they log a mood
   * @param {String} userId - User's ID
   * @returns {Object} - Streak info and new achievements
   */
  async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get today's date at midnight (ignore time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // First mood ever?
      if (!user.streak.lastLogDate) {
        user.streak.current = 1;
        user.streak.longest = 1;
        user.streak.lastLogDate = today;
        await user.save();
        
        logger.info(`First mood logged for user ${userId}. Streak: 1`);
        
        return {
          streak: 1,
          longest: 1,
          newAchievements: []
        };
      }

      // Get last log date at midnight
      const lastLog = new Date(user.streak.lastLogDate);
      lastLog.setHours(0, 0, 0, 0);

      // Calculate days difference
      const daysDifference = Math.floor(
        (today - lastLog) / (1000 * 60 * 60 * 24)
      );

      let newAchievements = [];

      if (daysDifference === 0) {
        // Already logged today - no change
        logger.info(`User ${userId} already logged today. Streak unchanged: ${user.streak.current}`);
        
        return {
          streak: user.streak.current,
          longest: user.streak.longest,
          newAchievements: []
        };
        
      } else if (daysDifference === 1) {
        // Logged yesterday - continue streak! 🔥
        user.streak.current += 1;
        
        // Update longest streak if needed
        if (user.streak.current > user.streak.longest) {
          user.streak.longest = user.streak.current;
        }
        
        logger.info(`User ${userId} continued streak! Now: ${user.streak.current} days`);
        
        // Check for new achievements
        newAchievements = await this.checkAchievements(user);
        
      } else {
        // Missed a day - reset streak 😢
        logger.info(`User ${userId} missed a day. Streak reset from ${user.streak.current} to 1`);
        
        user.streak.current = 1;
      }

      // Update last log date
      user.streak.lastLogDate = today;
      await user.save();

      return {
        streak: user.streak.current,
        longest: user.streak.longest,
        newAchievements
      };

    } catch (error) {
      logger.error('Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Check and award achievements based on streak
   * @param {Object} user - User document
   * @returns {Array} - New achievements unlocked
   */
  async checkAchievements(user) {
    const achievements = [];
    const streak = user.streak.current;

    // Define achievement milestones
    const milestones = [
      { 
        streak: 3, 
        type: 'starter', 
        title: '🔥 3-Day Streak!',
        description: 'You\'re getting started!'
      },
      { 
        streak: 7, 
        type: 'week-warrior', 
        title: '⚡ Week Warrior!',
        description: '7 days strong!'
      },
      { 
        streak: 14, 
        type: 'two-weeker', 
        title: '💪 Two-Week Champion!',
        description: 'Unstoppable!'
      },
      { 
        streak: 30, 
        type: 'month-master', 
        title: '👑 Month Master!',
        description: '30 days of growth!'
      },
      { 
        streak: 50, 
        type: 'fifty-fighter', 
        title: '🌟 Fifty Fighter!',
        description: 'Incredible dedication!'
      },
      { 
        streak: 100, 
        type: 'century-legend', 
        title: '🏆 Century Legend!',
        description: '100 days! Amazing!'
      },
      { 
        streak: 365, 
        type: 'year-champion', 
        title: '🎉 Year Champion!',
        description: 'A full year of moods!'
      }
    ];

    // Check each milestone
    for (const milestone of milestones) {
      if (streak === milestone.streak) {
        // Check if user already has this achievement
        const hasAchievement = user.achievements.some(
          a => a.type === milestone.type
        );

        if (!hasAchievement) {
          // Add new achievement
          user.achievements.push({
            type: milestone.type,
            title: milestone.title,
            unlockedAt: new Date()
          });
          
          achievements.push(milestone);
          
          logger.info(`🎉 Achievement unlocked for user ${user._id}: ${milestone.title}`);
        }
      }
    }

    if (achievements.length > 0) {
      await user.save();
    }

    return achievements;
  }

  /**
   * Get user's streak statistics
   * @param {String} userId - User's ID
   * @returns {Object} - Streak stats
   */
  async getStreakStats(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        current: user.streak.current || 0,
        longest: user.streak.longest || 0,
        lastLogDate: user.streak.lastLogDate,
        achievements: user.achievements || []
      };
    } catch (error) {
      logger.error('Error getting streak stats:', error);
      throw error;
    }
  }

  /**
   * Manually reset a user's streak (for testing or admin)
   * @param {String} userId - User's ID
   */
  async resetStreak(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      user.streak.current = 0;
      user.streak.lastLogDate = null;
      await user.save();

      logger.info(`Streak reset for user ${userId}`);

      return {
        message: 'Streak reset successfully',
        streak: 0
      };
    } catch (error) {
      logger.error('Error resetting streak:', error);
      throw error;
    }
  }
}

module.exports = new StreakService();