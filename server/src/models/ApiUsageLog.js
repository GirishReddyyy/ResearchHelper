const mongoose = require('mongoose');

const apiUsageLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  provider: {
    type: String,
    enum: ['arxiv', 'crossref', 'google_scholar', 'semantic_scholar', 'pubmed', 'openai'],
  },
  endpoint: String,
  method: { type: String, default: 'GET' },
  statusCode: Number,
  responseTime: Number, // ms
  error: String,
  searchQuery: { type: mongoose.Schema.Types.ObjectId, ref: 'SearchQuery' },
  timestamp: { type: Date, default: Date.now },
});

apiUsageLogSchema.index({ timestamp: -1 });
apiUsageLogSchema.index({ user: 1, timestamp: -1 });
apiUsageLogSchema.index({ provider: 1, timestamp: -1 });

module.exports = mongoose.model('ApiUsageLog', apiUsageLogSchema);
