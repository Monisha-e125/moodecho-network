const MOODS = {
  EMOJIS: {
    SAD: '😢',
    DOWN: '😔',
    HAPPY: '😊',
    GREAT: '😄',
    ANGRY: '😤',
    ANXIOUS: '😰',
    CALM: '😌',
    LOVE: '🤗'
  },
  
  SENTIMENTS: {
    VERY_NEGATIVE: 'very_negative',
    NEGATIVE: 'negative',
    NEUTRAL: 'neutral',
    POSITIVE: 'positive',
    VERY_POSITIVE: 'very_positive'
  },

  SCORE_RANGE: {
    MIN: 1,
    MAX: 10
  }
};

const WALK_THEMES = {
  OCEAN: 'ocean',
  RAIN: 'rain',
  FOREST: 'forest',
  MOUNTAIN: 'mountain',
  AURORA: 'aurora',
  DESERT: 'desert'
};

const WALK_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

const CACHE_KEYS = {
  USER_PROFILE: (userId) => `profile:${userId}`,
  USER_STATS: (userId) => `stats:${userId}`,
  MOOD_PATTERN: (userId) => `pattern:${userId}`
};

const CACHE_TTL = {
  SHORT: 300,
  MEDIUM: 1800,
  LONG: 3600,
  DAY: 86400
};

module.exports = {
  MOODS,
  WALK_THEMES,
  WALK_STATUS,
  CACHE_KEYS,
  CACHE_TTL
};