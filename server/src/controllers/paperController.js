const Paper = require('../models/Paper');

const listPapers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-credibilityScore';
    const search = req.query.search || '';
    const source = req.query.source || '';
    const minScore = parseInt(req.query.minScore) || 0;
    const yearStart = parseInt(req.query.yearStart) || 0;
    const yearEnd = parseInt(req.query.yearEnd) || 9999;

    const filter = { addedBy: req.user._id };
    if (search) {
      filter.$text = { $search: search };
    }
    if (source) filter.source = source;
    if (minScore) filter.credibilityScore = { $gte: minScore };
    if (yearStart || yearEnd < 9999) {
      filter.publicationYear = {};
      if (yearStart) filter.publicationYear.$gte = yearStart;
      if (yearEnd < 9999) filter.publicationYear.$lte = yearEnd;
    }

    const papers = await Paper.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-rawMetadata -references');

    const total = await Paper.countDocuments(filter);

    res.json({ papers, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getPaper = async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found.' });
    res.json(paper);
  } catch (error) {
    next(error);
  }
};

const deletePaper = async (req, res, next) => {
  try {
    await Paper.findOneAndDelete({ _id: req.params.id, addedBy: req.user._id });
    res.json({ message: 'Paper deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listPapers, getPaper, deletePaper };
