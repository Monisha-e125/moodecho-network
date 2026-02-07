const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    if (process.env.NODE_ENV !== 'production' && !process.env.REDIS_ENABLED) {
      logger.info('Redis disabled in development mode');
      return null;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          return retries * 500;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error.message);
    return null;
  }
};

const cache = {
  async get(key) {
    if (!redisClient || !redisClient.isOpen) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, expirationInSeconds = 3600) {
    if (!redisClient || !redisClient.isOpen) return false;
    try {
      await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    if (!redisClient || !redisClient.isOpen) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }
};

module.exports = { connectRedis, cache, redisClient };