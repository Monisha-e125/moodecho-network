const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Cache middleware for API responses
 * @param {Number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Function to generate cache key
 */
const cacheMiddleware = (ttl = 300, keyGenerator) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `route:${req.originalUrl}:${req.user?._id || 'guest'}`;

      // Try to get from cache
      const cachedResponse = await cacheService.cache.get(cacheKey);

      if (cachedResponse) {
        logger.info(`Cache HIT: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      logger.info(`Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Cache the response
        cacheService.cache.set(cacheKey, data, ttl)
          .catch(err => logger.error('Cache set error:', err));

        // Send response
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue even if cache fails
    }
  };
};

/**
 * Cache key generators for different routes
 */
const cacheKeys = {
  userProfile: (req) => `user:profile:${req.user._id}`,
  
  moodStats: (req) => `user:${req.user._id}:stats`,
  
  moodHistory: (req) => {
    const { days = 7, page = 1, limit = 10 } = req.query;
    return `user:${req.user._id}:history:${days}:${page}:${limit}`;
  },
  
  matchProfile: (req) => `user:${req.user._id}:match-profile`,
  
  walkHistory: (req) => {
    const { page = 1, limit = 10 } = req.query;
    return `user:${req.user._id}:walks:${page}:${limit}`;
  }
};

module.exports = {
  cacheMiddleware,
  cacheKeys
};