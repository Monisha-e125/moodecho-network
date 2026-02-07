const { cache } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../config/constants');
const logger = require('../utils/logger');

class CacheService {
  
  /**
   * Get user profile with caching
   * @param {ObjectId} userId 
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @returns {Object} - User profile data
   */
  async getUserProfile(userId, fetchFn) {
    const key = CACHE_KEYS.USER_PROFILE(userId);
    
    try {
      // Try cache first
      const cached = await cache.get(key);
      if (cached) {
        logger.info(`Cache HIT: ${key}`);
        return cached;
      }

      // Cache miss - fetch from database
      logger.info(`Cache MISS: ${key}`);
      const data = await fetchFn();
      
      // Store in cache for next time
      if (data) {
        await cache.set(key, data, CACHE_TTL.MEDIUM);
      }
      
      return data;
    } catch (error) {
      logger.error('Cache error in getUserProfile:', error);
      // If cache fails, still return fresh data
      return await fetchFn();
    }
  }

  /**
   * Get mood statistics with caching
   * @param {ObjectId} userId 
   * @param {Function} fetchFn 
   * @returns {Object} - Mood statistics
   */
  async getMoodStats(userId, fetchFn) {
    const key = CACHE_KEYS.USER_STATS(userId);
    
    try {
      const cached = await cache.get(key);
      if (cached) {
        logger.info(`Cache HIT: ${key}`);
        return cached;
      }

      logger.info(`Cache MISS: ${key}`);
      const data = await fetchFn();
      
      if (data) {
        // Stats change frequently, shorter TTL
        await cache.set(key, data, CACHE_TTL.SHORT);
      }
      
      return data;
    } catch (error) {
      logger.error('Cache error in getMoodStats:', error);
      return await fetchFn();
    }
  }

  /**
   * Get mood pattern with caching
   * @param {ObjectId} userId 
   * @param {Function} fetchFn 
   * @returns {Object} - Mood pattern data
   */
  async getMoodPattern(userId, fetchFn) {
    const key = CACHE_KEYS.MOOD_PATTERN(userId);
    
    try {
      const cached = await cache.get(key);
      if (cached) {
        logger.info(`Cache HIT: ${key}`);
        return cached;
      }

      logger.info(`Cache MISS: ${key}`);
      const data = await fetchFn();
      
      if (data) {
        // Patterns don't change often, longer TTL
        await cache.set(key, data, CACHE_TTL.LONG);
      }
      
      return data;
    } catch (error) {
      logger.error('Cache error in getMoodPattern:', error);
      return await fetchFn();
    }
  }

  /**
   * Invalidate user-related caches
   * @param {ObjectId} userId 
   */
  async invalidateUserCache(userId) {
    try {
      const keys = [
        CACHE_KEYS.USER_PROFILE(userId),
        CACHE_KEYS.USER_STATS(userId),
        CACHE_KEYS.MOOD_PATTERN(userId)
      ];

      await Promise.all(keys.map(key => cache.del(key)));
      
      logger.info(`Cache invalidated for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  /**
   * Cache mood history with pagination
   * @param {ObjectId} userId 
   * @param {Number} page 
   * @param {Number} limit 
   * @param {Function} fetchFn 
   */
  async getMoodHistory(userId, page, limit, fetchFn) {
    const key = `${CACHE_KEYS.USER_STATS(userId)}:history:${page}:${limit}`;
    
    try {
      const cached = await cache.get(key);
      if (cached) {
        logger.info(`Cache HIT: ${key}`);
        return cached;
      }

      logger.info(`Cache MISS: ${key}`);
      const data = await fetchFn();
      
      if (data) {
        // Mood history changes frequently
        await cache.set(key, data, CACHE_TTL.SHORT);
      }
      
      return data;
    } catch (error) {
      logger.error('Cache error in getMoodHistory:', error);
      return await fetchFn();
    }
  }

  /**
   * Warm up cache for a user (preload common queries)
   * @param {ObjectId} userId 
   */
  async warmUpUserCache(userId, userService, moodService) {
    try {
      logger.info(`Warming up cache for user: ${userId}`);

      // Preload user profile
      await this.getUserProfile(userId, () => userService.getProfile(userId));

      // Preload mood stats
      await this.getMoodStats(userId, () => moodService.getStats(userId));

      logger.info(`Cache warmed up for user: ${userId}`);
    } catch (error) {
      logger.error('Error warming up cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const info = await cache.client?.info?.();
      
      return {
        connected: cache.client?.status === 'ready',
        hits: 0, // Would need Redis commands to track this
        misses: 0,
        memory: info // Redis memory info
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new CacheService();