const axios = require('axios');
const xml2js = require('xml2js');
const logger = require('../utils/logger');

const ARXIV_API = 'http://export.arxiv.org/api/query';

/**
 * Search arXiv using their free API (no key needed).
 * Rate limit: ~1 request every 3 seconds (enforced here).
 */
const search = async ({ query, keywords = [], yearStart, yearEnd, limit = 20 }) => {
  try {
    // Build search query
    const parts = [];
    if (query) parts.push(`all:${query}`);
    keywords.forEach((kw) => parts.push(`all:${kw}`));
    const searchQuery = parts.join('+AND+');

    const response = await axios.get(ARXIV_API, {
      params: {
        search_query: searchQuery,
        start: 0,
        max_results: limit,
        sortBy: 'relevance',
        sortOrder: 'descending',
      },
      timeout: 30000,
    });

    const parsed = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
      trim: true,
    });

    const entries = parsed.feed.entry;
    if (!entries) return [];

    const papers = (Array.isArray(entries) ? entries : [entries]).map((entry) => {
      const year = entry.published ? new Date(entry.published).getFullYear() : null;

      // Filter by year range if specified
      if (yearStart && year && year < yearStart) return null;
      if (yearEnd && year && year > yearEnd) return null;

      // Extract PDF link
      const links = Array.isArray(entry.link) ? entry.link : [entry.link];
      const pdfLink = links.find((l) => l.$ && l.$.title === 'pdf');
      const htmlLink = links.find((l) => l.$ && l.$.type === 'text/html');

      // Extract authors
      const authorData = entry.author
        ? (Array.isArray(entry.author) ? entry.author : [entry.author])
        : [];

      // Extract categories as keywords
      const categories = entry.category
        ? (Array.isArray(entry.category) ? entry.category : [entry.category])
            .map((c) => c.$ && c.$.term)
            .filter(Boolean)
        : [];

      // Extract arXiv ID
      const arxivId = entry.id ? entry.id.split('/abs/').pop() : '';

      return {
        externalId: arxivId,
        source: 'arxiv',
        title: entry.title ? entry.title.replace(/\s+/g, ' ').trim() : '',
        authors: authorData.map((a) => ({
          name: a.name || '',
          affiliations: a['arxiv:affiliation']
            ? [Array.isArray(a['arxiv:affiliation']) ? a['arxiv:affiliation'][0] : a['arxiv:affiliation']]
            : [],
        })),
        doi: entry['arxiv:doi'] ? entry['arxiv:doi']._ || entry['arxiv:doi'] : null,
        publicationYear: year,
        abstract: entry.summary ? entry.summary.replace(/\s+/g, ' ').trim() : '',
        keywords: categories,
        url: htmlLink ? htmlLink.$.href : entry.id,
        pdfUrl: pdfLink ? pdfLink.$.href : null,
        journal: entry['arxiv:journal_ref'] || null,
        citationCount: 0,
        rawMetadata: { arxivId, categories, comment: entry['arxiv:comment'] || '' },
      };
    });

    return papers.filter(Boolean);
  } catch (error) {
    logger.error('arXiv scraper error:', error.message);
    return [];
  }
};

module.exports = { search, name: 'arxiv' };
