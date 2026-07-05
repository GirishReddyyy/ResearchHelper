const { Queue } = require('bullmq');
const { getRedisClient } = require('./redis');

let queues = {};

const initQueues = () => {
  const connection = getRedisClient();

  queues = {
    search: new Queue('search-queue', { connection }),
    report: new Queue('report-queue', { connection }),
    ai: new Queue('ai-queue', { connection }),
  };

  return queues;
};

const getQueue = (name) => {
  if (!queues[name]) {
    throw new Error(`Queue "${name}" not initialized. Call initQueues first.`);
  }
  return queues[name];
};

module.exports = { initQueues, getQueue };
