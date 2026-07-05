require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const { connectDB } = require('../config/db');
const { connectRedis, getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const createSearchWorker = require('./searchWorker');
const createReportWorker = require('./reportWorker');

const startWorkers = async () => {
  // Connect to DB and Redis
  await connectDB(process.env.MONGODB_URI);
  const redis = connectRedis(process.env.REDIS_URL);

  // Create workers
  const searchWorker = createSearchWorker(redis);
  const reportWorker = createReportWorker(redis);

  logger.info('🔧 Workers started: search-queue, report-queue');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await searchWorker.close();
    await reportWorker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startWorkers().catch((err) => {
  logger.error('Worker startup failed:', err);
  process.exit(1);
});
