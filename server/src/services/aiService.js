const logger = require('../utils/logger');

let openai = null;

/**
 * Initialize OpenAI client if API key is available
 */
const getClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const isAvailable = () => !!process.env.OPENAI_API_KEY;

const UNAVAILABLE_RESPONSE = {
  available: false,
  message: 'AI features are disabled. Add your OPENAI_API_KEY in .env to enable.',
};

/**
 * Call OpenAI with a prompt
 */
const callAI = async (systemPrompt, userContent) => {
  const client = getClient();
  if (!client) return UNAVAILABLE_RESPONSE;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return {
      available: true,
      content: response.choices[0].message.content,
      usage: response.usage,
    };
  } catch (error) {
    logger.error('OpenAI API error:', error.message);
    throw error;
  }
};

/**
 * Generate a literature review from papers
 */
const generateLiteratureReview = async (papers) => {
  if (!isAvailable()) return UNAVAILABLE_RESPONSE;

  const paperSummaries = papers.map((p, i) =>
    `[${i + 1}] "${p.title}" (${p.publicationYear || 'n.d.'}) by ${p.authors?.map(a => a.name).join(', ') || 'Unknown'}
    Abstract: ${p.abstract?.substring(0, 500) || 'N/A'}
    Citations: ${p.citationCount || 0}, Source: ${p.source}`
  ).join('\n\n');

  return callAI(
    `You are an academic research assistant. Write a comprehensive literature review based on the provided papers. 
    Structure it with an introduction, thematic sections grouping related work, and a conclusion.
    Use in-text citations referencing paper numbers [1], [2], etc.
    Write in formal academic tone. Be thorough but concise.`,
    `Write a literature review based on these ${papers.length} papers:\n\n${paperSummaries}`
  );
};

/**
 * Generate a research summary
 */
const generateSummary = async (papers) => {
  if (!isAvailable()) return UNAVAILABLE_RESPONSE;

  const paperSummaries = papers.map((p, i) =>
    `[${i + 1}] "${p.title}" (${p.publicationYear}) - ${p.abstract?.substring(0, 300) || 'N/A'}`
  ).join('\n\n');

  return callAI(
    `You are an academic research assistant. Generate an executive summary of the research landscape based on the provided papers.
    Include: key themes, major findings, consensus points, and overall state of the field.
    Keep it concise (300-500 words). Use formal academic tone.`,
    `Summarize the research landscape from these papers:\n\n${paperSummaries}`
  );
};

/**
 * Identify trends in the research
 */
const identifyTrends = async (papers) => {
  if (!isAvailable()) return UNAVAILABLE_RESPONSE;

  const paperSummaries = papers.map((p) =>
    `"${p.title}" (${p.publicationYear}) - ${p.abstract?.substring(0, 200) || 'N/A'} [Citations: ${p.citationCount}]`
  ).join('\n');

  return callAI(
    `You are a research trend analyst. Analyze the provided papers and identify:
    1. Emerging trends and methodologies
    2. Temporal patterns (how the field has evolved)
    3. Most influential topics (by citation count)
    4. Declining topics
    Format with clear headers and bullet points.`,
    `Analyze trends in these papers:\n\n${paperSummaries}`
  );
};

/**
 * Identify research gaps
 */
const identifyGaps = async (papers) => {
  if (!isAvailable()) return UNAVAILABLE_RESPONSE;

  const paperSummaries = papers.map((p) =>
    `"${p.title}" (${p.publicationYear}) - ${p.abstract?.substring(0, 300) || 'N/A'}`
  ).join('\n\n');

  return callAI(
    `You are a research gap analyst. Analyze the provided papers and identify:
    1. Under-researched areas within this field
    2. Methodological gaps
    3. Conflicting findings that need resolution
    4. Future research directions
    5. Limitations commonly mentioned across papers
    Be specific and cite which papers support your analysis.`,
    `Identify research gaps from these papers:\n\n${paperSummaries}`
  );
};

/**
 * Compare two papers
 */
const comparePapers = async (paperA, paperB) => {
  if (!isAvailable()) return UNAVAILABLE_RESPONSE;

  const contentA = `Title: ${paperA.title}\nYear: ${paperA.publicationYear}\nAbstract: ${paperA.abstract || 'N/A'}\nMethodology: ${paperA.methodology || 'N/A'}\nFindings: ${paperA.findings || 'N/A'}`;
  const contentB = `Title: ${paperB.title}\nYear: ${paperB.publicationYear}\nAbstract: ${paperB.abstract || 'N/A'}\nMethodology: ${paperB.methodology || 'N/A'}\nFindings: ${paperB.findings || 'N/A'}`;

  return callAI(
    `You are a research paper comparison expert. Compare two academic papers and highlight:
    1. Similarities in approach, methodology, and findings
    2. Differences and contradictions
    3. Complementary aspects
    4. Which paper appears more rigorous/credible and why
    Use a structured format with clear headers.`,
    `Compare these two papers:\n\n--- Paper A ---\n${contentA}\n\n--- Paper B ---\n${contentB}`
  );
};

module.exports = {
  isAvailable,
  generateLiteratureReview,
  generateSummary,
  identifyTrends,
  identifyGaps,
  comparePapers,
};
