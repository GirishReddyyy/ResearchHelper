const { generateCitation, generateBibTeX } = require('../utils/citationFormatter');
const Paper = require('../models/Paper');

/**
 * Generate citation for a single paper
 */
const generate = async (paperId, format) => {
  const paper = await Paper.findById(paperId);
  if (!paper) {
    const error = new Error('Paper not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    citation: generateCitation(paper, format),
    format,
    paperId,
  };
};

/**
 * Generate citations for multiple papers
 */
const batchGenerate = async (paperIds, format) => {
  const papers = await Paper.find({ _id: { $in: paperIds } });

  return papers.map((paper) => ({
    paperId: paper._id,
    title: paper.title,
    citation: generateCitation(paper, format),
    format,
  }));
};

/**
 * Generate BibTeX for one or more papers
 */
const exportBibTeX = async (paperIds) => {
  const papers = await Paper.find({ _id: { $in: paperIds } });

  const entries = papers.map((paper) => generateBibTeX(paper));
  return entries.join('\n\n');
};

module.exports = { generate, batchGenerate, exportBibTeX };
