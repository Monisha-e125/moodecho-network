const User = require('../models/User');
const logger = require('../utils/logger');

class StreakService {

    /**
     * Update user's streak when they log a mood
     */
    async updateStreak(userId) {
        try {
            const user = await User.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // First mood ever
            if (!user.streak.lastLogDate) {
                user.streak.current = 1;
                user.streak.longest = 1;
                user.streak.lastLogDate = today;
                await user.save();
                return { streak: 1, newAchievements: [] };
            }

            const lastLog = new Date(user.streak.lastLogDate);
            lastLog.setHours(0, 0, 0, 0);

            const daysSinceLastLog = Math.floor(
                (today - lastLog) / (1000 * 60 * 60 * 24)
            );

            let newAchievements = [];

            if (daysSinceLastLog === 0) {
                // Already logged today - no change
                return { streak: user.streak.current, newAchievements: [] };
            } else if (daysSinceLastLog === 1) {
                // Logged yesterday - continue streak!
                user.streak.current += 1;

                // Update longest streak
                if (user.streak.current > user.streak.longest) {
                    user.streak.longest = user.streak.current;
                }

                // Check for achievements
                newAchievements = await this.checkAchievements(user);

            } else {
                // Missed a day - reset streak
                user.streak.current = 1;
            }

            user.streak.lastLogDate = today;
            await user.save();

            logger.info(`Updated streak for user ${userId}: ${user.streak.current} days`);

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
     * Check and award achievements
     */
    async checkAchievements(user) {
        const achievements = [];
        const streak = user.streak.current;

        // Define achievement thresholds
        const milestones = [
            { streak: 3, type: 'starter', title: '🔥 3-Day Streak', description: 'Getting started!' },
            { streak: 7, type: 'week-warrior', title: '⚡ Week Warrior', description: '7 days strong!' },
            { streak: 14, type: 'two-week-champ', title: '💪 Two-Week Champion', description: 'Unstoppable!' },
            { streak: 30, type: 'month-master', title: '👑 Month Master', description: '30 days of growth!' },
            { streak: 50, type: 'fifty-fighter', title: '🌟 Fifty Fighter', description: 'Incredible dedication!' },
            { streak: 100, type: 'century-legend', title: '🏆 Century Legend', description: '100 days! Amazing!' },
            { streak: 365, type: 'year-champion', title: '🎉 Year Champion', description: 'A full year!' }
        ];

        // Check each milestone
        for (const milestone of milestones) {
            if (streak === milestone.streak) {
                // Check if user already has this achievement
                const hasAchievement = user.achievements.some(
                    a => a.type === milestone.type
                );

                if (!hasAchievement) {
                    user.achievements.push({
                        type: milestone.type,
                        unlockedAt: new Date()
                    });

                    achievements.push(milestone);

                    logger.info(`Achievement unlocked for user ${user._id}: ${milestone.title}`);
                }
            }
        }

        if (achievements.length > 0) {
            await user.save();
        }

        return achievements;
    }

    /**
     * Get user's streak stats
     */
    async getStreakStats(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        return {
            current: user.streak?.current || 0,
            longest: user.streak?.longest || 0,
            lastLogDate: user.streak?.lastLogDate || null,
            achievements: user.achievements || []
        };
    }
}

module.exports = new StreakService();