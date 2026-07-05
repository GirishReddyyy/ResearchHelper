const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    externalId: String,
    source: {
      type: String,
      enum: ['semantic_scholar', 'crossref', 'arxiv', 'core', 'pubmed', 'google_scholar'],
    },
    title: { type: String, required: true },
    authors: [
      {
        name: String,
        affiliations: [String],
      },
    ],
    doi: { type: String, sparse: true },
    publicationYear: Number,
    abstract: String,
    methodology: String,
    findings: String,
    statistics: [
      {
        label: String,
        value: String,
        context: String,
      },
    ],
    keywords: [String],
    journal: String,
    volume: String,
    issue: String,
    pages: String,
    publisher: String,
    url: String,
    pdfUrl: String,
    citationCount: { type: Number, default: 0 },
    referenceCount: { type: Number, default: 0 },
    references: [
      {
        title: String,
        doi: String,
      },
    ],
    credibilityScore: { type: Number, default: 0, min: 0, max: 100 },
    credibilityDetails: {
      sourceType: {
        type: String,
        enum: ['peer_reviewed', 'preprint', 'government', 'university', 'conference', 'other'],
      },
      journalRanking: String,
      citationImpact: String,
      verificationStatus: {
        type: String,
        enum: ['verified', 'unverified', 'rejected'],
        default: 'unverified',
      },
    },
    rawMetadata: mongoose.Schema.Types.Mixed,
    searchQueries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SearchQuery' }],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
paperSchema.index({ doi: 1 }, { sparse: true });
paperSchema.index({ externalId: 1, source: 1 });
paperSchema.index({ title: 'text', abstract: 'text' });
paperSchema.index({ publicationYear: -1 });
paperSchema.index({ credibilityScore: -1 });
paperSchema.index({ addedBy: 1 });

module.exports = mongoose.model('Paper', paperSchema);
