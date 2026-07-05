const { Worker } = require('bullmq');
const { executeSearch } = require('../services/searchService');
const logger = require('../utils/logger');

const createSearchWorker = (connection) => {
  const worker = new Worker(
    'search-queue',
    async (job) => {
      logger.info(`Processing search job ${job.id}: ${job.data.searchQueryId}`);
      await executeSearch(job.data.searchQueryId);
      logger.info(`Search job ${job.id} completed`);
    },
    {
      connection,
      concurrency: 3,
      limiter: {
        max: 5,
        duration: 60000, // 5 jobs per minute to respect API rate limits
      },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Search job ${job.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    logger.info(`Search job ${job.id} finished successfully`);
  });

  return worker;
};

module.exports = createSearchWorker;
