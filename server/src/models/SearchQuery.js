const mongoose = require('mongoose');

const searchQuerySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true, trim: true },
    keywords: [String],
    yearRange: {
      start: Number,
      end: Number,
    },
    domain: String,
    sources: [
      {
        type: String,
        enum: ['arxiv', 'crossref', 'google_scholar', 'semantic_scholar', 'pubmed'],
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    resultCount: { type: Number, default: 0 },
    papers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }],
    jobId: String,
    error: String,
    duration: Number, // ms
  },
  { timestamps: true }
);

searchQuerySchema.index({ user: 1, createdAt: -1 });
searchQuerySchema.index({ status: 1 });

module.exports = mongoose.model('SearchQuery', searchQuerySchema);
