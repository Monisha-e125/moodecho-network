const MoodWalk = require('../models/MoodWalk');
const matchingService = require('./matchingService');
const { roundTo } = require('../utils/helpers');
const logger = require('../utils/logger');

class WalkService {
  
  /**
   * Generate a mood walk based on two users' mood profiles
   * @param {Object} profile1 - First user's mood profile
   * @param {Object} profile2 - Second user's mood profile
   * @param {Number} compatibilityScore - Compatibility score
   * @returns {Object} - Walk configuration
   */
  generateWalk(profile1, profile2, compatibilityScore) {
    // Calculate combined mood score
    const avgMood = (profile1.avgMood + profile2.avgMood) / 2;
    
    // Select theme based on combined mood
    const theme = this.selectTheme(avgMood, profile1.dominantSentiment, profile2.dominantSentiment);
    
    // Generate ambience for theme
    const ambience = this.generateAmbience(theme, avgMood);
    
    // Calculate duration based on compatibility and mood
    const duration = this.calculateDuration(compatibilityScore, avgMood);

    return {
      theme,
      ambience,
      duration,
      compatibilityScore
    };
  }

  /**
   * Select appropriate theme based on mood scores
   * @param {Number} avgMood - Average mood score
   * @param {String} sentiment1 - First user's sentiment
   * @param {String} sentiment2 - Second user's sentiment
   * @returns {String} - Selected theme
   */
  selectTheme(avgMood, sentiment1, sentiment2) {
    // Check if both users have negative sentiments
    const bothNegative = ['very_negative', 'negative'].includes(sentiment1) && 
                         ['very_negative', 'negative'].includes(sentiment2);
    
    const bothPositive = ['very_positive', 'positive'].includes(sentiment1) && 
                         ['very_positive', 'positive'].includes(sentiment2);

    // Theme selection logic
    if (bothNegative || avgMood < 4) {
      return 'ocean'; // Calming for low moods
    }
    
    if (avgMood < 5) {
      return 'rain'; // Reflective and gentle
    }
    
    if (avgMood < 7) {
      return 'forest'; // Peaceful and grounding
    }
    
    if (avgMood < 8.5) {
      return 'mountain'; // Energizing and uplifting
    }
    
    if (bothPositive || avgMood >= 8.5) {
      return 'aurora'; // Magical for very positive moods
    }
    
    return 'desert'; // Contemplative middle ground
  }

  /**
   * Generate ambience configuration for a theme
   * @param {String} theme - Selected theme
   * @param {Number} avgMood - Average mood score
   * @returns {Object} - Ambience configuration
   */
  generateAmbience(theme, avgMood) {
    const themes = {
      ocean: {
        sounds: ['gentle-waves', 'seagulls', 'soft-breeze', 'distant-boat'],
        visualElements: ['water', 'horizon', 'sunset', 'sand', 'shells', 'foam'],
        colorPalette: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#f59e0b'],
        description: 'A peaceful walk along a serene coastline at sunset, with gentle waves lapping at your feet'
      },
      rain: {
        sounds: ['light-rain', 'distant-thunder', 'wind-chimes', 'water-drops'],
        visualElements: ['raindrops', 'puddles', 'clouds', 'mist', 'wet-leaves', 'reflections'],
        colorPalette: ['#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
        description: 'A contemplative journey through a gentle rainstorm, finding peace in the rhythm of falling rain'
      },
      forest: {
        sounds: ['birds-chirping', 'rustling-leaves', 'flowing-stream', 'wind-through-trees'],
        visualElements: ['tall-trees', 'sunlight-beams', 'forest-path', 'wildlife', 'ferns', 'moss'],
        colorPalette: ['#14532d', '#166534', '#16a34a', '#22c55e', '#86efac', '#fef3c7'],
        description: 'A refreshing path through a sunlit forest, surrounded by ancient trees and peaceful nature'
      },
      mountain: {
        sounds: ['mountain-wind', 'eagles', 'distant-echo', 'crunching-snow'],
        visualElements: ['snow-peaks', 'rocky-path', 'clear-sky', 'valley-view', 'alpine-flowers'],
        colorPalette: ['#0c4a6e', '#0369a1', '#0284c7', '#7dd3fc', '#e0f2fe', '#ffffff'],
        description: 'An invigorating trek across majestic mountain peaks with breathtaking views'
      },
      aurora: {
        sounds: ['ambient-hum', 'celestial-tones', 'soft-wind', 'ethereal-music'],
        visualElements: ['northern-lights', 'stars', 'snow', 'night-sky', 'dancing-colors', 'cosmic-glow'],
        colorPalette: ['#1e1b4b', '#4c1d95', '#7c3aed', '#a78bfa', '#34d399', '#6ee7b7'],
        description: 'A magical experience under the dancing northern lights, filled with wonder and joy'
      },
      desert: {
        sounds: ['gentle-wind', 'silence', 'distant-drums', 'sand-shifting'],
        visualElements: ['sand-dunes', 'cacti', 'starry-sky', 'warm-glow', 'desert-flowers', 'oasis'],
        colorPalette: ['#78350f', '#92400e', '#d97706', '#fbbf24', '#fde68a', '#fef3c7'],
        description: 'A tranquil walk through warm desert sands under a stunning starlit sky'
      }
    };

    const baseAmbience = themes[theme] || themes.forest;

    // Adjust intensity based on mood
    const intensity = this.calculateIntensity(avgMood);
    
    return {
      ...baseAmbience,
      intensity,
      tempo: avgMood > 7 ? 'upbeat' : avgMood > 4 ? 'moderate' : 'calm'
    };
  }

  /**
   * Calculate intensity of ambient experience
   * @param {Number} avgMood 
   * @returns {String}
   */
  calculateIntensity(avgMood) {
    if (avgMood < 4) return 'subtle';
    if (avgMood < 7) return 'moderate';
    return 'vibrant';
  }

  /**
   * Calculate walk duration based on compatibility and mood
   * @param {Number} compatibilityScore 
   * @param {Number} avgMood 
   * @returns {Number} - Duration in minutes
   */
  calculateDuration(compatibilityScore, avgMood) {
    // Base duration: 10 minutes
    let duration = 10;

    // Add time for high compatibility (up to +5 mins)
    if (compatibilityScore >= 80) duration += 5;
    else if (compatibilityScore >= 60) duration += 3;
    else if (compatibilityScore >= 40) duration += 2;

    // Adjust for mood intensity
    if (avgMood > 8) duration += 2; // High energy = longer walk
    if (avgMood < 4) duration -= 2; // Low energy = shorter walk

    // Keep within bounds
    return Math.max(5, Math.min(30, duration));
  }

  /**
   * Get theme description
   * @param {String} theme 
   * @returns {String}
   */
  getThemeDescription(theme) {
    const descriptions = {
      ocean: 'A peaceful walk along a serene coastline at sunset',
      rain: 'A contemplative journey through a gentle rainstorm',
      forest: 'A refreshing path through a sunlit forest',
      mountain: 'An invigorating trek across mountain peaks',
      aurora: 'A magical experience under the dancing northern lights',
      desert: 'A tranquil walk through warm desert sands under stars'
    };
    return descriptions[theme] || descriptions.forest;
  }

  /**
   * Generate walk recommendations for user
   * @param {ObjectId} userId 
   * @returns {Array} - Recommended themes
   */
  async getWalkRecommendations(userId) {
    const profile = await matchingService.getUserMoodProfile(userId);
    
    if (!profile) {
      return {
        message: 'Log more moods to get personalized walk recommendations',
        recommendations: []
      };
    }

    const recommendations = [];
    const avgMood = profile.avgMood;
    const sentiment = profile.dominantSentiment;

    // Recommend based on current mood state
    if (avgMood < 4) {
      recommendations.push({
        theme: 'ocean',
        reason: 'Calming waves to soothe your mind',
        priority: 'high'
      });
      recommendations.push({
        theme: 'rain',
        reason: 'Gentle rain for peaceful reflection',
        priority: 'medium'
      });
    } else if (avgMood < 7) {
      recommendations.push({
        theme: 'forest',
        reason: 'Nature to ground and center you',
        priority: 'high'
      });
      recommendations.push({
        theme: 'mountain',
        reason: 'Fresh mountain air for clarity',
        priority: 'medium'
      });
    } else {
      recommendations.push({
        theme: 'aurora',
        reason: 'Celebrate your positive energy',
        priority: 'high'
      });
      recommendations.push({
        theme: 'mountain',
        reason: 'Energizing peaks match your vibe',
        priority: 'medium'
      });
    }

    return {
      currentMood: roundTo(avgMood, 1),
      sentiment,
      recommendations
    };
  }

  /**
   * Create walk progress checkpoints
   * @param {Number} duration - Walk duration in minutes
   * @param {String} theme 
   * @returns {Array} - Checkpoints for the walk
   */
  generateCheckpoints(duration, theme) {
    const checkpoints = [];
    const intervals = Math.floor(duration / 3); // 3 checkpoints

    const checkpointMessages = {
      ocean: [
        'Feel the cool water on your feet...',
        'Watch the sun paint the sky in colors...',
        'Listen to the rhythm of the waves...'
      ],
      rain: [
        'Let the rain wash away your worries...',
        'Notice the fresh scent in the air...',
        'Feel renewed and cleansed...'
      ],
      forest: [
        'Breathe in the fresh forest air...',
        'Notice the peaceful sounds around you...',
        'Feel connected to nature...'
      ],
      mountain: [
        'Feel your strength as you climb...',
        'Pause and admire the view...',
        'Embrace your accomplishment...'
      ],
      aurora: [
        'Marvel at the dancing lights...',
        'Feel the magic in the air...',
        'Embrace this moment of wonder...'
      ],
      desert: [
        'Feel the warmth of the sand...',
        'Look up at the endless stars...',
        'Find peace in the stillness...'
      ]
    };

    const messages = checkpointMessages[theme] || checkpointMessages.forest;

    for (let i = 0; i < 3; i++) {
      checkpoints.push({
        time: (i + 1) * intervals,
        message: messages[i],
        checkpoint: i + 1
      });
    }

    return checkpoints;
  }
}

module.exports = new WalkService();