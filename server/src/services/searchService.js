const Paper = require('../models/Paper');
const SearchQuery = require('../models/SearchQuery');
const User = require('../models/User');
const ApiUsageLog = require('../models/ApiUsageLog');
const { scorePaper } = require('../utils/credibilityScorer');
const logger = require('../utils/logger');

// Import all scrapers
const arxivScraper = require('../scrapers/arxivScraper');
const crossrefScraper = require('../scrapers/crossrefScraper');
const semanticScholarScraper = require('../scrapers/semanticScholarScraper');
const googleScholarScraper = require('../scrapers/googleScholarScraper');
const pubmedScraper = require('../scrapers/pubmedScraper');

const SCRAPERS = {
  arxiv: arxivScraper,
  crossref: crossrefScraper,
  semantic_scholar: semanticScholarScraper,
  google_scholar: googleScholarScraper,
  pubmed: pubmedScraper,
};

/**
 * Execute a search across selected sources.
 * Called directly for quick searches or from BullMQ worker for heavy ones.
 */
const executeSearch = async (searchQueryId) => {
  const searchQuery = await SearchQuery.findById(searchQueryId);
  if (!searchQuery) throw new Error('Search query not found');

  const startTime = Date.now();
  searchQuery.status = 'processing';
  await searchQuery.save();

  try {
    // Determine which scrapers to use
    const sourcesToUse = searchQuery.sources?.length
      ? searchQuery.sources
      : Object.keys(SCRAPERS);

    const searchParams = {
      query: searchQuery.topic,
      keywords: searchQuery.keywords || [],
      yearStart: searchQuery.yearRange?.start,
      yearEnd: searchQuery.yearRange?.end,
      limit: 20,
    };

    // Run all scrapers in parallel
    const results = await Promise.allSettled(
      sourcesToUse.map(async (sourceName) => {
        const scraper = SCRAPERS[sourceName];
        if (!scraper) return [];

        const apiStart = Date.now();
        try {
          const papers = await scraper.search(searchParams);

          // Log API usage
          await ApiUsageLog.create({
            user: searchQuery.user,
            provider: sourceName,
            endpoint: 'search',
            statusCode: 200,
            responseTime: Date.now() - apiStart,
            searchQuery: searchQuery._id,
          });

          return papers;
        } catch (err) {
          await ApiUsageLog.create({
            user: searchQuery.user,
            provider: sourceName,
            endpoint: 'search',
            statusCode: 500,
            responseTime: Date.now() - apiStart,
            error: err.message,
            searchQuery: searchQuery._id,
          });
          return [];
        }
      })
    );

    // Flatten results
    const allPapers = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    // Deduplicate by DOI or title similarity
    const deduped = deduplicatePapers(allPapers);

    // Score and save each paper
    const savedPaperIds = [];
    for (const paper of deduped) {
      const duplicateCount = allPapers.filter(
        (p) => p.doi && p.doi === paper.doi
      ).length || 1;

      const { score, details } = scorePaper(paper, duplicateCount);

      // Skip low-quality sources (below threshold of 30)
      if (score < 30) continue;

      // Upsert paper (update if DOI exists, create otherwise)
      let existing = null;
      if (paper.doi) {
        existing = await Paper.findOne({ doi: paper.doi });
      }

      if (existing) {
        // Update credibility if this search found higher score
        if (score > existing.credibilityScore) {
          existing.credibilityScore = score;
          existing.credibilityDetails = details;
        }
        existing.searchQueries.addToSet(searchQuery._id);
        await existing.save();
        savedPaperIds.push(existing._id);
      } else {
        const newPaper = await Paper.create({
          ...paper,
          credibilityScore: score,
          credibilityDetails: details,
          searchQueries: [searchQuery._id],
          addedBy: searchQuery.user,
        });
        savedPaperIds.push(newPaper._id);
      }
    }

    // Update search query
    searchQuery.status = 'completed';
    searchQuery.resultCount = savedPaperIds.length;
    searchQuery.papers = savedPaperIds;
    searchQuery.duration = Date.now() - startTime;
    await searchQuery.save();

    // Update user search count
    await User.findByIdAndUpdate(searchQuery.user, {
      $inc: { searchCount: 1, papersCollected: savedPaperIds.length },
    });

    logger.info(`Search completed: ${savedPaperIds.length} papers found in ${searchQuery.duration}ms`);

    return searchQuery;
  } catch (error) {
    searchQuery.status = 'failed';
    searchQuery.error = error.message;
    searchQuery.duration = Date.now() - startTime;
    await searchQuery.save();
    throw error;
  }
};

/**
 * Deduplicate papers by DOI or fuzzy title match
 */
const deduplicatePapers = (papers) => {
  const seen = new Map(); // doi/normalized-title → paper
  const result = [];

  for (const paper of papers) {
    // Key by DOI if available
    if (paper.doi) {
      if (seen.has(paper.doi)) continue;
      seen.set(paper.doi, true);
    } else {
      // Normalize title for comparison
      const normalizedTitle = paper.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedTitle.length > 20 && seen.has(normalizedTitle)) continue;
      if (normalizedTitle.length > 20) seen.set(normalizedTitle, true);
    }
    result.push(paper);
  }

  return result;
};

/**
 * Create a search query and return its ID (for BullMQ)
 */
const createSearchQuery = async (userId, params) => {
  const searchQuery = await SearchQuery.create({
    user: userId,
    topic: params.topic,
    keywords: params.keywords || [],
    yearRange: params.yearRange || {},
    domain: params.domain || '',
    sources: params.sources || [],
    status: 'pending',
  });

  return searchQuery;
};

module.exports = { executeSearch, createSearchQuery };
