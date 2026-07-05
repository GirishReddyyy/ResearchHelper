const { Readable } = require('stream');
const { getGridFSBucket } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Upload a buffer to GridFS
 * @returns {Promise<ObjectId>} The GridFS file ID
 */
const uploadToGridFS = (buffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const readStream = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, { metadata });

    readStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      logger.info(`GridFS upload complete: ${filename} (${uploadStream.id})`);
      resolve(uploadStream.id);
    });

    uploadStream.on('error', (err) => {
      logger.error(`GridFS upload error: ${err.message}`);
      reject(err);
    });
  });
};

/**
 * Download a file from GridFS as a readable stream
 */
const downloadFromGridFS = (fileId) => {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(fileId);
};

/**
 * Delete a file from GridFS
 */
const deleteFromGridFS = async (fileId) => {
  const bucket = getGridFSBucket();
  await bucket.delete(fileId);
  logger.info(`GridFS file deleted: ${fileId}`);
};

/**
 * Get file info from GridFS
 */
const getFileInfo = async (fileId) => {
  const bucket = getGridFSBucket();
  const cursor = bucket.find({ _id: fileId });
  const files = await cursor.toArray();
  return files[0] || null;
};

module.exports = { uploadToGridFS, downloadFromGridFS, deleteFromGridFS, getFileInfo };
