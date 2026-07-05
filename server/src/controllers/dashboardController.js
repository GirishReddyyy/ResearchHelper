const SearchQuery = require('../models/SearchQuery');
const Paper = require('../models/Paper');
const Report = require('../models/Report');
const ApiUsageLog = require('../models/ApiUsageLog');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [searches, papers, reports, recentSearches] = await Promise.all([
      SearchQuery.countDocuments({ user: userId }),
      Paper.countDocuments({ addedBy: userId }),
      Report.countDocuments({ user: userId }),
      SearchQuery.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('topic status resultCount createdAt'),
    ]);

    res.json({
      totalSearches: searches,
      totalPapers: papers,
      totalReports: reports,
      recentSearches,
    });
  } catch (error) {
    next(error);
  }
};

const getApiUsage = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const usage = await ApiUsageLog.aggregate([
      { $match: { user: req.user._id, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { provider: '$provider', day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        },
      },
      { $sort: { '_id.day': -1 } },
    ]);

    res.json({ usage, period: `${days} days` });
  } catch (error) {
    next(error);
  }
};

const getTopSources = async (req, res, next) => {
  try {
    const sources = await Paper.aggregate([
      { $match: { addedBy: req.user._id } },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          avgCredibility: { $avg: '$credibilityScore' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ sources });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getApiUsage, getTopSources };
