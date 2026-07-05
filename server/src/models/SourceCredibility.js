const mongoose = require('mongoose');

const sourceCredibilitySchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, unique: true, lowercase: true },
    type: {
      type: String,
      enum: ['journal', 'preprint_server', 'government', 'university', 'conference', 'other'],
      default: 'other',
    },
    baseScore: { type: Number, required: true, min: 0, max: 100 },
    peerReviewed: { type: Boolean, default: false },
    impactFactor: Number,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('SourceCredibility', sourceCredibilitySchema);
