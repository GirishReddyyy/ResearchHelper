/**
 * Credibility scoring engine.
 * Scores papers 0-100 based on source type, citations, publisher, and cross-referencing.
 */

// Source type base scores
const SOURCE_SCORES = {
  peer_reviewed: 85,
  government: 90,
  university: 80,
  conference: 70,
  preprint: 50,
  other: 40,
};

// Known high-credibility publishers/journals
const HIGH_CRED_PUBLISHERS = [
  'nature', 'science', 'elsevier', 'springer', 'wiley', 'ieee', 'acm',
  'oxford university press', 'cambridge university press', 'taylor & francis',
  'plos', 'bmj', 'lancet', 'cell press', 'aaas', 'pnas',
];

const HIGH_CRED_DOMAINS = [
  '.gov', '.edu', '.ac.uk', '.ac.jp', '.ac.kr',
];

/**
 * Determine source type from paper metadata
 */
const detectSourceType = (paper) => {
  const source = paper.source;
  const url = (paper.url || '').toLowerCase();
  const journal = (paper.journal || '').toLowerCase();

  // arXiv is preprint
  if (source === 'arxiv') return 'preprint';

  // Government sources
  if (HIGH_CRED_DOMAINS.some((d) => url.includes(d))) return 'government';

  // CrossRef/PubMed with DOI → likely peer reviewed
  if ((source === 'crossref' || source === 'pubmed') && paper.doi) return 'peer_reviewed';

  // Known high-cred publishers
  if (HIGH_CRED_PUBLISHERS.some((p) => journal.includes(p))) return 'peer_reviewed';

  // Semantic Scholar with venue
  if (source === 'semantic_scholar' && paper.journal) return 'peer_reviewed';

  return 'other';
};

/**
 * Calculate citation impact score (0-15 bonus)
 * Uses log scale to avoid outlier domination
 */
const citationScore = (count) => {
  if (!count || count <= 0) return 0;
  return Math.min(15, Math.round(Math.log10(count + 1) * 5));
};

/**
 * Publisher reputation bonus (0-10)
 */
const publisherBonus = (paper) => {
  const journal = (paper.journal || '').toLowerCase();
  const publisher = (paper.publisher || '').toLowerCase();
  const combined = `${journal} ${publisher}`;

  if (HIGH_CRED_PUBLISHERS.some((p) => combined.includes(p))) return 10;
  return 0;
};

/**
 * Recency bonus — recent papers get a small boost (0-5)
 */
const recencyBonus = (year) => {
  if (!year) return 0;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age <= 2) return 5;
  if (age <= 5) return 3;
  if (age <= 10) return 1;
  return 0;
};

/**
 * Cross-reference bonus — paper found in multiple sources (0-10)
 */
const crossRefBonus = (duplicateCount) => {
  if (duplicateCount >= 3) return 10;
  if (duplicateCount >= 2) return 5;
  return 0;
};

/**
 * Score a paper for credibility (0-100)
 * @param {Object} paper - Normalized paper object
 * @param {number} duplicateCount - Number of sources where this paper was found
 * @returns {{ score: number, details: Object }}
 */
const scorePaper = (paper, duplicateCount = 1) => {
  const sourceType = detectSourceType(paper);
  const base = SOURCE_SCORES[sourceType] || SOURCE_SCORES.other;

  const citations = citationScore(paper.citationCount);
  const publisher = publisherBonus(paper);
  const recency = recencyBonus(paper.publicationYear);
  const crossRef = crossRefBonus(duplicateCount);

  // Weighted sum, capped at 100
  const score = Math.min(100, Math.round(
    base * 0.6 + citations + publisher + recency + crossRef
  ));

  // Determine verification status
  let verificationStatus = 'unverified';
  if (score >= 70) verificationStatus = 'verified';
  if (score < 30) verificationStatus = 'rejected';

  return {
    score,
    details: {
      sourceType,
      journalRanking: publisher > 0 ? 'high' : 'standard',
      citationImpact: citations >= 10 ? 'high' : citations >= 5 ? 'medium' : 'low',
      verificationStatus,
    },
  };
};

module.exports = { scorePaper, detectSourceType };
