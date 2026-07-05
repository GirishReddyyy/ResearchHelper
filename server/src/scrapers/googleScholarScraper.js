const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

const SCHOLAR_URL = 'https://scholar.google.com/scholar';

// Rotating user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Scrape Google Scholar search results using Cheerio.
 * CAUTION: Google aggressively blocks scrapers.
 * Falls back gracefully and returns empty array if blocked.
 */
const search = async ({ query, keywords = [], yearStart, yearEnd, limit = 10 }) => {
  try {
    const fullQuery = [query, ...keywords].filter(Boolean).join(' ');

    const params = { q: fullQuery, hl: 'en' };
    if (yearStart) params.as_ylo = yearStart;
    if (yearEnd) params.as_yhi = yearEnd;

    // Random delay (5-12 seconds) to avoid detection
    await delay(5000 + Math.random() * 7000);

    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const response = await axios.get(SCHOLAR_URL, {
      params,
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://scholar.google.com/',
      },
      timeout: 20000,
    });

    // Check for CAPTCHA
    if (response.data.includes('captcha') || response.data.includes('unusual traffic')) {
      logger.warn('Google Scholar CAPTCHA detected — skipping.');
      return [];
    }

    const $ = cheerio.load(response.data);
    const papers = [];

    $('.gs_r.gs_or.gs_scl').each((i, el) => {
      if (papers.length >= limit) return false;

      const titleEl = $(el).find('.gs_rt a');
      const title = titleEl.text().trim();
      const url = titleEl.attr('href') || '';

      // Author / journal line
      const metaLine = $(el).find('.gs_a').text();
      const metaParts = metaLine.split(' - ');

      // Parse authors
      const authorStr = metaParts[0] || '';
      const authors = authorStr.split(',').map((name) => ({
        name: name.replace(/…/g, '').trim(),
        affiliations: [],
      })).filter((a) => a.name);

      // Parse year from meta
      const yearMatch = metaLine.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;

      // Journal / publisher
      const journal = metaParts[1] ? metaParts[1].trim() : '';

      // Snippet
      const abstract = $(el).find('.gs_rs').text().trim();

      // Citation count
      const citedText = $(el).find('.gs_fl a').filter((_, a) => $(a).text().includes('Cited by')).text();
      const citedMatch = citedText.match(/Cited by (\d+)/);
      const citationCount = citedMatch ? parseInt(citedMatch[1]) : 0;

      // PDF link
      const pdfEl = $(el).find('.gs_or_ggsm a');
      const pdfUrl = pdfEl.attr('href') || null;

      if (title) {
        papers.push({
          externalId: url || `gs-${i}`,
          source: 'google_scholar',
          title,
          authors,
          doi: null,
          publicationYear: year,
          abstract,
          keywords: [],
          journal,
          url,
          pdfUrl,
          citationCount,
          rawMetadata: { metaLine },
        });
      }
    });

    return papers;
  } catch (error) {
    if (error.response?.status === 429 || error.response?.status === 503) {
      logger.warn('Google Scholar blocked request (429/503) — skipping.');
    } else {
      logger.error('Google Scholar scraper error:', error.message);
    }
    return [];
  }
};

module.exports = { search, name: 'google_scholar' };
