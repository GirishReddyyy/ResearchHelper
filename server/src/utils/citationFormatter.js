/**
 * Citation formatter — generates citations in IEEE, APA 7th, MLA 9th, Chicago 17th, and BibTeX formats.
 */

const formatAuthorsAPA = (authors) => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const parts = authors[0].name.split(' ');
    const last = parts.pop();
    const initials = parts.map((p) => `${p[0]}.`).join(' ');
    return `${last}, ${initials}`.trim();
  }
  if (authors.length <= 20) {
    return authors.map((a, i) => {
      const parts = a.name.split(' ');
      const last = parts.pop();
      const initials = parts.map((p) => `${p[0]}.`).join(' ');
      if (i === authors.length - 1) return `& ${last}, ${initials}`.trim();
      return `${last}, ${initials}`.trim();
    }).join(', ');
  }
  // More than 20 authors
  const first19 = authors.slice(0, 19).map((a) => {
    const parts = a.name.split(' ');
    const last = parts.pop();
    const initials = parts.map((p) => `${p[0]}.`).join(' ');
    return `${last}, ${initials}`.trim();
  }).join(', ');
  const lastAuthor = authors[authors.length - 1];
  const lParts = lastAuthor.name.split(' ');
  const lLast = lParts.pop();
  const lInitials = lParts.map((p) => `${p[0]}.`).join(' ');
  return `${first19}, . . . ${lLast}, ${lInitials}`.trim();
};

const formatAuthorsMLA = (authors) => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const parts = authors[0].name.split(' ');
    const last = parts.pop();
    return `${last}, ${parts.join(' ')}`;
  }
  if (authors.length === 2) {
    const first = authors[0].name.split(' ');
    const fLast = first.pop();
    return `${fLast}, ${first.join(' ')}, and ${authors[1].name}`;
  }
  const first = authors[0].name.split(' ');
  const fLast = first.pop();
  return `${fLast}, ${first.join(' ')}, et al.`;
};

const formatAuthorsChicago = (authors) => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const parts = authors[0].name.split(' ');
    const last = parts.pop();
    return `${last}, ${parts.join(' ')}`;
  }
  const first = authors[0].name.split(' ');
  const fLast = first.pop();
  const rest = authors.slice(1).map((a) => a.name);
  if (authors.length <= 3) {
    return `${fLast}, ${first.join(' ')}, ${rest.slice(0, -1).join(', ')}${rest.length > 1 ? ',' : ''} and ${rest[rest.length - 1]}`;
  }
  return `${fLast}, ${first.join(' ')}, et al.`;
};

const formatAuthorsIEEE = (authors) => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  return authors.map((a) => {
    const parts = a.name.split(' ');
    const last = parts.pop();
    const initials = parts.map((p) => `${p[0]}.`).join(' ');
    return `${initials} ${last}`.trim();
  }).join(', ');
};

/**
 * Generate citation for a paper in specified format
 */
const generateCitation = (paper, format) => {
  const { title, authors, publicationYear, journal, volume, issue, pages, doi, url } = paper;
  const year = publicationYear || 'n.d.';

  switch (format.toLowerCase()) {
    case 'apa': {
      const authorStr = formatAuthorsAPA(authors);
      let citation = `${authorStr} (${year}). ${title}.`;
      if (journal) {
        citation += ` *${journal}*`;
        if (volume) citation += `, *${volume}*`;
        if (issue) citation += `(${issue})`;
        if (pages) citation += `, ${pages}`;
        citation += '.';
      }
      if (doi) citation += ` https://doi.org/${doi}`;
      else if (url) citation += ` ${url}`;
      return citation;
    }

    case 'mla': {
      const authorStr = formatAuthorsMLA(authors);
      let citation = `${authorStr}. "${title}."`;
      if (journal) {
        citation += ` *${journal}*`;
        if (volume) citation += `, vol. ${volume}`;
        if (issue) citation += `, no. ${issue}`;
        citation += `, ${year}`;
        if (pages) citation += `, pp. ${pages}`;
        citation += '.';
      } else {
        citation += ` ${year}.`;
      }
      if (doi) citation += ` https://doi.org/${doi}.`;
      return citation;
    }

    case 'chicago': {
      const authorStr = formatAuthorsChicago(authors);
      let citation = `${authorStr}. "${title}."`;
      if (journal) {
        citation += ` *${journal}*`;
        if (volume) citation += ` ${volume}`;
        if (issue) citation += `, no. ${issue}`;
        citation += ` (${year})`;
        if (pages) citation += `: ${pages}`;
        citation += '.';
      } else {
        citation += ` ${year}.`;
      }
      if (doi) citation += ` https://doi.org/${doi}.`;
      return citation;
    }

    case 'ieee': {
      const authorStr = formatAuthorsIEEE(authors);
      let citation = `${authorStr}, "${title},"`;
      if (journal) {
        citation += ` *${journal}*`;
        if (volume) citation += `, vol. ${volume}`;
        if (issue) citation += `, no. ${issue}`;
        if (pages) citation += `, pp. ${pages}`;
        citation += `, ${year}`;
      } else {
        citation += ` ${year}`;
      }
      citation += '.';
      if (doi) citation += ` doi: ${doi}.`;
      return citation;
    }

    default:
      return `${authors?.map((a) => a.name).join(', ')} (${year}). ${title}.`;
  }
};

/**
 * Generate BibTeX entry for a paper
 */
const generateBibTeX = (paper) => {
  const { title, authors, publicationYear, journal, volume, issue, pages, doi, url } = paper;

  // Generate cite key: FirstAuthorLastName + Year
  const firstAuthor = authors?.[0]?.name?.split(' ').pop() || 'Unknown';
  const key = `${firstAuthor.toLowerCase()}${publicationYear || ''}`;

  const type = journal ? 'article' : 'misc';
  const lines = [`@${type}{${key},`];
  lines.push(`  title = {${title || ''}},`);

  if (authors?.length) {
    lines.push(`  author = {${authors.map((a) => a.name).join(' and ')}},`);
  }
  if (publicationYear) lines.push(`  year = {${publicationYear}},`);
  if (journal) lines.push(`  journal = {${journal}},`);
  if (volume) lines.push(`  volume = {${volume}},`);
  if (issue) lines.push(`  number = {${issue}},`);
  if (pages) lines.push(`  pages = {${pages}},`);
  if (doi) lines.push(`  doi = {${doi}},`);
  if (url) lines.push(`  url = {${url}},`);

  lines.push('}');
  return lines.join('\n');
};

module.exports = { generateCitation, generateBibTeX };
