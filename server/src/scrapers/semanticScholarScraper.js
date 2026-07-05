const axios = require('axios');
const logger = require('../utils/logger');

const S2_API = 'https://api.semanticscholar.org/graph/v1';

/**
 * Search Semantic Scholar using their free API (100 req / 5 min, no key needed).
 */
const search = async ({ query, keywords = [], yearStart, yearEnd, limit = 20 }) => {
  try {
    const fullQuery = [query, ...keywords].filter(Boolean).join(' ');

    const params = {
      query: fullQuery,
      limit: Math.min(limit, 100),
      fields: 'title,abstract,authors,year,citationCount,externalIds,journal,url,venue,referenceCount,publicationDate',
    };

    // Year filter
    if (yearStart || yearEnd) {
      params.year = `${yearStart || ''}-${yearEnd || ''}`;
    }

    const response = await axios.get(`${S2_API}/paper/search`, {
      params,
      timeout: 30000,
      headers: { 'Accept': 'application/json' },
    });

    const papers = response.data.data || [];

    return papers.map((paper) => ({
      externalId: paper.paperId,
      source: 'semantic_scholar',
      title: paper.title || '',
      authors: (paper.authors || []).map((a) => ({
        name: a.name || '',
        affiliations: [],
      })),
      doi: paper.externalIds?.DOI || null,
      publicationYear: paper.year,
      abstract: paper.abstract || '',
      keywords: [],
      journal: paper.journal?.name || paper.venue || '',
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfUrl: paper.openAccessPdf?.url || null,
      citationCount: paper.citationCount || 0,
      referenceCount: paper.referenceCount || 0,
      rawMetadata: {
        paperId: paper.paperId,
        externalIds: paper.externalIds,
        publicationDate: paper.publicationDate,
      },
    }));
  } catch (error) {
    if (error.response?.status === 429) {
      logger.warn('Semantic Scholar rate limited. Backing off...');
    } else {
      logger.error('Semantic Scholar scraper error:', error.message);
    }
    return [];
  }
};

module.exports = { search, name: 'semantic_scholar' };
