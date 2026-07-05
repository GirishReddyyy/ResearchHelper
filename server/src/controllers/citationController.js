const citationService = require('../services/citationService');

const generate = async (req, res, next) => {
  try {
    const { paperId, format } = req.body;
    const result = await citationService.generate(paperId, format || 'apa');
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const batchGenerate = async (req, res, next) => {
  try {
    const { paperIds, format } = req.body;
    const results = await citationService.batchGenerate(paperIds, format || 'apa');
    res.json({ citations: results });
  } catch (error) {
    next(error);
  }
};

const exportBibTeX = async (req, res, next) => {
  try {
    const { paperIds } = req.body;
    const bibtex = await citationService.exportBibTeX(paperIds);
    res.setHeader('Content-Type', 'application/x-bibtex');
    res.setHeader('Content-Disposition', 'attachment; filename="references.bib"');
    res.send(bibtex);
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, batchGenerate, exportBibTeX };
