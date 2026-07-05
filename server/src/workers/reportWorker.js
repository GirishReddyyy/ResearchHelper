const { Worker } = require('bullmq');
const { generateReportFiles } = require('../services/reportService');
const logger = require('../utils/logger');

const createReportWorker = (connection) => {
  const worker = new Worker(
    'report-queue',
    async (job) => {
      logger.info(`Processing report job ${job.id}: ${job.data.reportId}`);
      await generateReportFiles(job.data.reportId);
      logger.info(`Report job ${job.id} completed`);
    },
    {
      connection,
      concurrency: 2, // CPU-bound, keep low
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Report job ${job.id} failed:`, err.message);
  });

  return worker;
};

module.exports = createReportWorker;
