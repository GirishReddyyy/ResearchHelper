const axios = require('axios');
const logger = require('../utils/logger');

const CROSSREF_API = 'https://api.crossref.org/works';

/**
 * Search CrossRef using their free API (no key needed).
 * Polite pool: include mailto email for better rate limits.
 */
const search = async ({ query, keywords = [], yearStart, yearEnd, limit = 20 }) => {
  try {
    const fullQuery = [query, ...keywords].filter(Boolean).join(' ');

    const params = {
      query: fullQuery,
      rows: limit,
      sort: 'relevance',
      order: 'desc',
    };

    // Year filter
    const filters = [];
    if (yearStart) filters.push(`from-pub-date:${yearStart}`);
    if (yearEnd) filters.push(`until-pub-date:${yearEnd}`);
    if (filters.length) params.filter = filters.join(',');

    const headers = {};
    if (process.env.CROSSREF_EMAIL) {
      headers['User-Agent'] = `ResearchHelper/1.0 (mailto:${process.env.CROSSREF_EMAIL})`;
    }

    const response = await axios.get(CROSSREF_API, {
      params,
      headers,
      timeout: 30000,
    });

    const items = response.data.message.items || [];

    return items.map((item) => {
      // Extract authors
      const authors = (item.author || []).map((a) => ({
        name: [a.given, a.family].filter(Boolean).join(' '),
        affiliations: (a.affiliation || []).map((af) => af.name),
      }));

      // Extract year
      const dateParts = item['published-print']?.['date-parts']?.[0]
        || item['published-online']?.['date-parts']?.[0]
        || item.created?.['date-parts']?.[0]
        || [];
      const year = dateParts[0] || null;

      return {
        externalId: item.DOI,
        source: 'crossref',
        title: Array.isArray(item.title) ? item.title[0] : item.title || '',
        authors,
        doi: item.DOI,
        publicationYear: year,
        abstract: item.abstract
          ? item.abstract.replace(/<[^>]*>/g, '').trim()
          : '',
        keywords: item.subject || [],
        journal: item['container-title']
          ? (Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'])
          : '',
        volume: item.volume || '',
        issue: item.issue || '',
        pages: item.page || '',
        publisher: item.publisher || '',
        url: item.URL || `https://doi.org/${item.DOI}`,
        pdfUrl: null,
        citationCount: item['is-referenced-by-count'] || 0,
        referenceCount: item['references-count'] || 0,
        references: (item.reference || []).slice(0, 50).map((ref) => ({
          title: ref['article-title'] || ref.unstructured || '',
          doi: ref.DOI || null,
        })),
        rawMetadata: {
          type: item.type,
          issn: item.ISSN,
          isbn: item.ISBN,
          license: item.license,
        },
      };
    });
  } catch (error) {
    logger.error('CrossRef scraper error:', error.message);
    return [];
  }
};

module.exports = { search, name: 'crossref' };
