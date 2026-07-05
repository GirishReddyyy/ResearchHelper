import { Paper, Author } from "../types";

// Very basic title similarity check (could be improved with Levenshtein in production)
function isSimilarTitle(t1: string, t2: string): boolean {
  if (!t1 || !t2) return false;
  const clean1 = t1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const clean2 = t2.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean1 === clean2;
}

export function dedupePapers(papers: Paper[]): Paper[] {
  const merged: Map<string, Paper> = new Map();
  const titleMap: Map<string, string> = new Map(); // maps cleaned title to main ID

  for (const paper of papers) {
    let targetId = paper.doi ? paper.doi.toLowerCase() : null;
    
    // If no DOI match, try fuzzy title match
    if (!targetId || !merged.has(targetId)) {
      const cleanTitle = (paper.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (titleMap.has(cleanTitle)) {
        targetId = titleMap.get(cleanTitle) || null;
      }
    }

    // If still no target, this is a new paper
    if (!targetId || !merged.has(targetId)) {
      const newId = targetId || paper.id;
      merged.set(newId, { ...paper });
      
      const cleanTitle = (paper.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      titleMap.set(cleanTitle, newId);
      continue;
    }

    // Merge with existing paper
    const existing = merged.get(targetId)!;
    
    // Combine arrays uniquely
    const newSources = Array.from(new Set([...existing.sources, ...paper.sources]));
    const newConcepts = Array.from(new Set([...existing.concepts, ...paper.concepts]));
    
    // Choose best metadata (e.g. longest abstract, most authors)
    const abstract = (paper.abstract?.length || 0) > (existing.abstract?.length || 0) ? paper.abstract : existing.abstract;
    const authors = paper.authors.length > existing.authors.length ? paper.authors : existing.authors;
    const openAccessUrl = existing.openAccessUrl || paper.openAccessUrl;
    
    // Update rawSourceIds
    const rawSourceIds = { ...existing.rawSourceIds, ...paper.rawSourceIds };

    merged.set(targetId, {
      ...existing,
      sources: newSources,
      concepts: newConcepts,
      abstract,
      authors,
      openAccessUrl,
      rawSourceIds,
      citationCount: Math.max(existing.citationCount, paper.citationCount),
      year: existing.year || paper.year,
      publishedDate: existing.publishedDate || paper.publishedDate,
      venue: existing.venue || paper.venue,
    });
  }

  // Return values sorted by citation count desc
  return Array.from(merged.values()).sort((a, b) => b.citationCount - a.citationCount);
}
