const { createSearchQuery, executeSearch } = require('../services/searchService');
const SearchQuery = require('../models/SearchQuery');
const { getQueue } = require('../config/bullmq');

const startSearch = async (req, res, next) => {
  try {
    const { topic, keywords, yearRange, domain, sources } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const searchQuery = await createSearchQuery(req.user._id, {
      topic, keywords, yearRange, domain, sources,
    });

    // Queue search job via BullMQ
    const queue = getQueue('search');
    const job = await queue.add('search', { searchQueryId: searchQuery._id.toString() }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    });

    searchQuery.jobId = job.id;
    await searchQuery.save();

    res.status(202).json({
      message: 'Search started',
      searchId: searchQuery._id,
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
};

const getSearchStatus = async (req, res, next) => {
  try {
    const searchQuery = await SearchQuery.findById(req.params.id);
    if (!searchQuery) return res.status(404).json({ error: 'Search not found.' });

    res.json({
      status: searchQuery.status,
      resultCount: searchQuery.resultCount,
      duration: searchQuery.duration,
      error: searchQuery.error,
    });
  } catch (error) {
    next(error);
  }
};

const getSearchResults = async (req, res, next) => {
  try {
    const searchQuery = await SearchQuery.findById(req.params.id)
      .populate({
        path: 'papers',
        options: { sort: { credibilityScore: -1 } },
      });

    if (!searchQuery) return res.status(404).json({ error: 'Search not found.' });

    res.json(searchQuery);
  } catch (error) {
    next(error);
  }
};

const getSearchHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const searches = await SearchQuery.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-papers');

    const total = await SearchQuery.countDocuments({ user: req.user._id });

    res.json({ searches, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const deleteSearch = async (req, res, next) => {
  try {
    await SearchQuery.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Search deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { startSearch, getSearchStatus, getSearchResults, getSearchHistory, deleteSearch };
