const axios = require('axios');
const xml2js = require('xml2js');
const logger = require('../utils/logger');

const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Search PubMed using free E-utilities (no key needed, 3 req/sec).
 * Two-step: ESearch for IDs, then EFetch for full records.
 */
const search = async ({ query, keywords = [], yearStart, yearEnd, limit = 20 }) => {
  try {
    const fullQuery = [query, ...keywords].filter(Boolean).join(' AND ');

    // Step 1: ESearch — get PMIDs
    const searchParams = {
      db: 'pubmed',
      term: fullQuery,
      retmax: limit,
      retmode: 'json',
      sort: 'relevance',
    };

    if (yearStart) searchParams.mindate = `${yearStart}/01/01`;
    if (yearEnd) searchParams.maxdate = `${yearEnd}/12/31`;
    if (yearStart || yearEnd) searchParams.datetype = 'pdat';

    const searchRes = await axios.get(ESEARCH, { params: searchParams, timeout: 20000 });
    const idList = searchRes.data.esearchresult?.idlist || [];

    if (idList.length === 0) return [];

    // Respect rate limit
    await delay(400);

    // Step 2: EFetch — get full records
    const fetchRes = await axios.get(EFETCH, {
      params: {
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'xml',
        rettype: 'abstract',
      },
      timeout: 30000,
    });

    const parsed = await xml2js.parseStringPromise(fetchRes.data, {
      explicitArray: false,
      trim: true,
    });

    const articles = parsed.PubmedArticleSet?.PubmedArticle;
    if (!articles) return [];

    const articleList = Array.isArray(articles) ? articles : [articles];

    return articleList.map((article) => {
      const medline = article.MedlineCitation;
      const art = medline?.Article;
      if (!art) return null;

      // Title
      const title = art.ArticleTitle || '';

      // Authors
      const authorList = art.AuthorList?.Author;
      const authors = authorList
        ? (Array.isArray(authorList) ? authorList : [authorList]).map((a) => ({
            name: [a.ForeName, a.LastName].filter(Boolean).join(' '),
            affiliations: a.AffiliationInfo
              ? [(Array.isArray(a.AffiliationInfo) ? a.AffiliationInfo[0] : a.AffiliationInfo).Affiliation]
              : [],
          }))
        : [];

      // Year
      const pubDate = art.Journal?.JournalIssue?.PubDate;
      const year = pubDate?.Year ? parseInt(pubDate.Year) : null;

      // Abstract
      const abstractTexts = art.Abstract?.AbstractText;
      let abstract = '';
      if (abstractTexts) {
        if (typeof abstractTexts === 'string') {
          abstract = abstractTexts;
        } else if (Array.isArray(abstractTexts)) {
          abstract = abstractTexts.map((t) => (typeof t === 'string' ? t : t._ || '')).join(' ');
        } else if (abstractTexts._) {
          abstract = abstractTexts._;
        }
      }

      // DOI
      const idList = art.ELocationID;
      let doi = null;
      if (idList) {
        const doiEntries = Array.isArray(idList) ? idList : [idList];
        const doiEntry = doiEntries.find((e) => e.$ && e.$.EIdType === 'doi');
        doi = doiEntry ? doiEntry._ || doiEntry : null;
      }

      // Keywords
      const meshHeadings = medline?.MeshHeadingList?.MeshHeading;
      const meshKeywords = meshHeadings
        ? (Array.isArray(meshHeadings) ? meshHeadings : [meshHeadings])
            .map((h) => h.DescriptorName?._ || h.DescriptorName || '')
            .filter(Boolean)
        : [];

      const pmid = medline?.PMID?._ || medline?.PMID || '';

      return {
        externalId: pmid,
        source: 'pubmed',
        title,
        authors,
        doi: typeof doi === 'string' ? doi : null,
        publicationYear: year,
        abstract,
        keywords: meshKeywords,
        journal: art.Journal?.Title || '',
        volume: art.Journal?.JournalIssue?.Volume || '',
        issue: art.Journal?.JournalIssue?.Issue || '',
        pages: art.Pagination?.MedlinePgn || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        pdfUrl: null,
        citationCount: 0,
        rawMetadata: { pmid, meshKeywords },
      };
    }).filter(Boolean);
  } catch (error) {
    logger.error('PubMed scraper error:', error.message);
    return [];
  }
};

module.exports = { search, name: 'pubmed' };
