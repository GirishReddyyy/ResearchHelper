const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    topic: String,
    sections: [
      {
        type: {
          type: String,
          enum: [
            'executive_summary',
            'literature_review',
            'key_statistics',
            'research_gaps',
            'charts',
            'references',
            'custom',
          ],
        },
        title: String,
        content: String, // Markdown content
        order: Number,
      },
    ],
    papers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }],
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed', 'failed'],
      default: 'draft',
    },
    // Files stored in GridFS
    files: [
      {
        format: { type: String, enum: ['pdf', 'docx', 'markdown'] },
        gridfsId: mongoose.Schema.Types.ObjectId,
        filename: String,
        size: Number,
        mimeType: String,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    // Virtual folder path for file explorer
    folder: { type: String, default: '/' },
    tags: [String],
    jobId: String,
  },
  { timestamps: true }
);

reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ folder: 1, user: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
