const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = (url) => {
  redisClient = new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error('Redis: max retries reached, giving up');
        return null;
      }
      return Math.min(times * 200, 5000);
    },
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis error:', err.message));

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
