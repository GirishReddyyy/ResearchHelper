const User = require('../models/User');
const SearchQuery = require('../models/SearchQuery');
const Paper = require('../models/Paper');
const Report = require('../models/Report');
const ApiUsageLog = require('../models/ApiUsageLog');

const getStats = async (req, res, next) => {
  try {
    const [users, searches, papers, reports] = await Promise.all([
      User.countDocuments(),
      SearchQuery.countDocuments(),
      Paper.countDocuments(),
      Report.countDocuments(),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt lastLogin');

    res.json({ users, searches, papers, reports, recentUsers });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(filter);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete yourself.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};

const getApiUsage = async (req, res, next) => {
  try {
    const usage = await ApiUsageLog.aggregate([
      {
        $group: {
          _id: '$provider',
          totalCalls: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          errorCount: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        },
      },
      { $sort: { totalCalls: -1 } },
    ]);

    res.json({ usage });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, listUsers, updateUser, deleteUser, getApiUsage };
