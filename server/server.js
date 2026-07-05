require('dotenv').config();

const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { initQueues } = require('./src/config/bullmq');
const createApp = require('./src/app');
const logger = require('./src/utils/logger');
const seedAdmin = require('./src/config/seed');

const start = async () => {
  // 1. Connect to MongoDB
  await connectDB(env.MONGODB_URI);

  // 2. Connect to Redis
  connectRedis(env.REDIS_URL);

  // 3. Initialize BullMQ queues
  initQueues();

  // 4. Seed default admin
  await seedAdmin();

  // 5. Create and start Express
  const app = createApp(env);

  app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📡 API: http://localhost:${env.PORT}/api`);
    if (env.OPENAI_API_KEY) {
      logger.info('🤖 AI features: enabled');
    } else {
      logger.warn('🤖 AI features: disabled (no OPENAI_API_KEY)');
    }
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
