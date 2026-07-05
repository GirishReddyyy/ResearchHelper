const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const logger = require('../utils/logger');

let gridFSBucket;

const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Initialize GridFS bucket for report storage
    gridFSBucket = new GridFSBucket(conn.connection.db, {
      bucketName: 'reports',
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFS bucket not initialized. Call connectDB first.');
  }
  return gridFSBucket;
};

module.exports = { connectDB, getGridFSBucket };
