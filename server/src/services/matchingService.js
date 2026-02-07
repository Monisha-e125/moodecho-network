const User = require('../models/User');
const Mood = require('../models/Mood');
const { roundTo } = require('../utils/helpers');
const logger = require('../utils/logger');

class MatchingService {
  
  /**
   * Find the best mood match for a user
   * @param {ObjectId} userId - User to find match for
   * @returns {Object} - Matched user and compatibility score
   */
  async findMoodMatch(userId) {
    try {
      // Get current user's mood profile
      const userProfile = await this.getUserMoodProfile(userId);
      
      if (!userProfile) {
        return {
          matched: false,
          message: 'You need at least 3 mood entries to find a match. Keep logging!'
        };
      }

      // Find potential matches (other active users with enough data)
      const potentialMatches = await User.find({
        _id: { $ne: userId },
        'stats.totalMoods': { $gte: 3 },
        isActive: true
      }).select('_id username moodProfile stats');

      if (potentialMatches.length === 0) {
        return {
          matched: false,
          message: 'No other users available for matching yet. Check back later!'
        };
      }

      // Score each potential match
      const scoredMatches = await Promise.all(
        potentialMatches.map(async (match) => {
          const matchProfile = await this.getUserMoodProfile(match._id);
          
          if (!matchProfile) {
            return { user: match, score: 0, profile: null };
          }

          const score = this.calculateCompatibilityScore(userProfile, matchProfile);
          
          return {
            user: match,
            score,
            profile: matchProfile
          };
        })
      );

      // Filter out users with no profile and sort by score
      const validMatches = scoredMatches
        .filter(m => m.profile !== null && m.score > 0)
        .sort((a, b) => b.score - a.score);

      if (validMatches.length === 0) {
        return {
          matched: false,
          message: 'No compatible matches found. Keep logging moods to improve matching!'
        };
      }

      // Get the best match
      const bestMatch = validMatches[0];

      logger.info(`Match found: User ${userId} matched with ${bestMatch.user.username} (score: ${bestMatch.score})`);

      return {
        matched: true,
        match: {
          userId: bestMatch.user._id,
          username: bestMatch.user.username,
          compatibilityScore: bestMatch.score,
          profile: {
            avgMoodScore: roundTo(bestMatch.profile.avgMood, 1),
            dominantSentiment: bestMatch.profile.dominantSentiment,
            totalEntries: bestMatch.profile.totalEntries,
            recentEmojis: bestMatch.profile.recentEmojis.slice(0, 3)
          }
        }
      };

    } catch (error) {
      logger.error('Error in findMoodMatch:', error);
      throw error;
    }
  }

  /**
   * Get user's mood profile for matching
   * @param {ObjectId} userId 
   * @returns {Object} - Mood profile with patterns
   */
  async getUserMoodProfile(userId) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const moods = await Mood.find({
        userId,
        timestamp: { $gte: sevenDaysAgo }
      }).sort({ timestamp: -1 });

      if (moods.length < 3) {
        return null;
      }

      // Calculate average mood score
      const avgMood = moods.reduce((sum, m) => sum + m.moodScore, 0) / moods.length;
      
      // Count sentiments
      const sentimentCounts = moods.reduce((acc, m) => {
        if (m.sentiment) {
          acc[m.sentiment] = (acc[m.sentiment] || 0) + 1;
        }
        return acc;
      }, {});

      // Get dominant sentiment
      const dominantSentiment = Object.entries(sentimentCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

      // Group moods by day of week
      const dayMoods = {};
      moods.forEach(m => {
        const day = m.dayOfWeek;
        if (!dayMoods[day]) dayMoods[day] = [];
        dayMoods[day].push(m.moodScore);
      });

      // Calculate day averages
      const dayAverages = {};
      Object.entries(dayMoods).forEach(([day, scores]) => {
        dayAverages[day] = scores.reduce((a, b) => a + b, 0) / scores.length;
      });

      // Get recent emojis
      const recentEmojis = moods.slice(0, 5).map(m => m.emoji);

      // Calculate mood variance (consistency)
      const variance = moods.reduce((sum, m) => 
        sum + Math.pow(m.moodScore - avgMood, 2), 0) / moods.length;

      return {
        avgMood,
        dominantSentiment,
        dayMoods,
        dayAverages,
        totalEntries: moods.length,
        recentEmojis,
        variance,
        moodRange: {
          min: Math.min(...moods.map(m => m.moodScore)),
          max: Math.max(...moods.map(m => m.moodScore))
        }
      };

    } catch (error) {
      logger.error('Error in getUserMoodProfile:', error);
      throw error;
    }
  }

  /**
   * Calculate compatibility score between two users
   * @param {Object} profile1 - First user's profile
   * @param {Object} profile2 - Second user's profile
   * @returns {Number} - Compatibility score (0-100)
   */
  calculateCompatibilityScore(profile1, profile2) {
    let score = 0;

    // 1. Similar average mood (40 points max)
    // Users with similar overall mood levels match better
    const moodDiff = Math.abs(profile1.avgMood - profile2.avgMood);
    const moodScore = Math.max(0, 40 - (moodDiff * 8));
    score += moodScore;

    // 2. Same dominant sentiment (30 points)
    // Users with same emotional tendency
    if (profile1.dominantSentiment === profile2.dominantSentiment) {
      score += 30;
    } else {
      // Partial credit for compatible sentiments
      const compatiblePairs = [
        ['positive', 'very_positive'],
        ['negative', 'very_negative'],
        ['neutral', 'positive'],
        ['neutral', 'negative']
      ];
      
      const sentiments = [profile1.dominantSentiment, profile2.dominantSentiment].sort();
      const isCompatible = compatiblePairs.some(pair => 
        pair[0] === sentiments[0] && pair[1] === sentiments[1]
      );
      
      if (isCompatible) score += 15;
    }

    // 3. Similar day patterns (20 points max)
    // Users who feel similar on same days
    const commonDays = Object.keys(profile1.dayAverages)
      .filter(day => profile2.dayAverages[day] !== undefined);
    
    if (commonDays.length > 0) {
      const dayScores = commonDays.map(day => {
        const diff = Math.abs(profile1.dayAverages[day] - profile2.dayAverages[day]);
        return Math.max(0, 10 - diff);
      });
      
      const avgDayScore = dayScores.reduce((a, b) => a + b, 0) / dayScores.length;
      score += (avgDayScore / 10) * 20; // Normalize to 20 points
    }

    // 4. Data richness bonus (10 points max)
    // More data = better match quality
    const avgEntries = (profile1.totalEntries + profile2.totalEntries) / 2;
    const dataBonus = Math.min(10, avgEntries / 2);
    score += dataBonus;

    return Math.round(score);
  }

  /**
   * Get detailed compatibility analysis
   * @param {ObjectId} userId1 
   * @param {ObjectId} userId2 
   * @returns {Object} - Detailed compatibility breakdown
   */
  async getCompatibilityAnalysis(userId1, userId2) {
    try {
      const profile1 = await this.getUserMoodProfile(userId1);
      const profile2 = await this.getUserMoodProfile(userId2);

      if (!profile1 || !profile2) {
        return {
          error: 'Not enough data for both users'
        };
      }

      const score = this.calculateCompatibilityScore(profile1, profile2);

      // Detailed breakdown
      const analysis = {
        overallScore: score,
        rating: this.getCompatibilityRating(score),
        breakdown: {
          moodAlignment: {
            user1Avg: roundTo(profile1.avgMood, 1),
            user2Avg: roundTo(profile2.avgMood, 1),
            difference: roundTo(Math.abs(profile1.avgMood - profile2.avgMood), 1),
            match: Math.abs(profile1.avgMood - profile2.avgMood) < 2 ? 'High' : 'Moderate'
          },
          sentimentMatch: {
            user1: profile1.dominantSentiment,
            user2: profile2.dominantSentiment,
            match: profile1.dominantSentiment === profile2.dominantSentiment
          },
          dayPatterns: this.compareDayPatterns(profile1, profile2)
        },
        recommendation: this.getMatchRecommendation(score)
      };

      return analysis;

    } catch (error) {
      logger.error('Error in getCompatibilityAnalysis:', error);
      throw error;
    }
  }

  /**
   * Compare day patterns between two profiles
   * @param {Object} profile1 
   * @param {Object} profile2 
   * @returns {Array} - Day-by-day comparison
   */
  compareDayPatterns(profile1, profile2) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const comparisons = [];

    days.forEach(day => {
      if (profile1.dayAverages[day] && profile2.dayAverages[day]) {
        const diff = Math.abs(profile1.dayAverages[day] - profile2.dayAverages[day]);
        comparisons.push({
          day,
          user1: roundTo(profile1.dayAverages[day], 1),
          user2: roundTo(profile2.dayAverages[day], 1),
          similarity: diff < 2 ? 'High' : diff < 4 ? 'Moderate' : 'Low'
        });
      }
    });

    return comparisons;
  }

  /**
   * Get compatibility rating from score
   * @param {Number} score 
   * @returns {String} - Rating description
   */
  getCompatibilityRating(score) {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Match';
    if (score >= 20) return 'Fair Match';
    return 'Low Match';
  }

  /**
   * Get recommendation based on score
   * @param {Number} score 
   * @returns {String} - Recommendation text
   */
  getMatchRecommendation(score) {
    if (score >= 80) {
      return 'You two have very similar mood patterns! A shared mood walk could be very beneficial.';
    }
    if (score >= 60) {
      return 'Good compatibility! You share similar emotional patterns that could make for a meaningful mood walk.';
    }
    if (score >= 40) {
      return 'Decent match. You might benefit from each other\'s perspectives during a mood walk.';
    }
    return 'Different mood patterns, but diverse perspectives can be valuable too!';
  }
}

module.exports = new MatchingService();