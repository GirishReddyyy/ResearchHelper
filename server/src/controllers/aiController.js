const aiService = require('../services/aiService');
const Paper = require('../models/Paper');

const checkAvailability = (req, res) => {
  res.json({ available: aiService.isAvailable() });
};

const generateLiteratureReview = async (req, res, next) => {
  try {
    const papers = await Paper.find({ _id: { $in: req.body.paperIds } });
    const result = await aiService.generateLiteratureReview(papers);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const generateSummary = async (req, res, next) => {
  try {
    const papers = await Paper.find({ _id: { $in: req.body.paperIds } });
    const result = await aiService.generateSummary(papers);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const identifyTrends = async (req, res, next) => {
  try {
    const papers = await Paper.find({ _id: { $in: req.body.paperIds } });
    const result = await aiService.identifyTrends(papers);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const identifyGaps = async (req, res, next) => {
  try {
    const papers = await Paper.find({ _id: { $in: req.body.paperIds } });
    const result = await aiService.identifyGaps(papers);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const comparePapers = async (req, res, next) => {
  try {
    const { paperIdA, paperIdB } = req.body;
    const [paperA, paperB] = await Promise.all([
      Paper.findById(paperIdA),
      Paper.findById(paperIdB),
    ]);
    if (!paperA || !paperB) {
      return res.status(404).json({ error: 'One or both papers not found.' });
    }
    const result = await aiService.comparePapers(paperA, paperB);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { checkAvailability, generateLiteratureReview, generateSummary, identifyTrends, identifyGaps, comparePapers };
