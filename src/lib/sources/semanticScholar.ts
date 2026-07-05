import { Paper } from "../types";

export const SOURCE_NAME = "Semantic Scholar";

// Basic exponential backoff helper
async function fetchWithBackoff(url: string, retries = 3, delay = 1000): Promise<Response> {
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    if (res.status === 429 && retries > 0) {
      console.warn(`[Rate Limit] Semantic Scholar 429 on ${url}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, retries - 1, delay * 2);
    }
    throw err;
  }
}

export async function searchSemanticScholar(query: string, limit: number = 10): Promise<Paper[]> {
  if (!query) return [];
  const fields = "title,authors,year,publicationDate,abstract,externalIds,venue,citationCount,isOpenAccess,openAccessPdf,s2FieldsOfStudy";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;

  const res = await fetchWithBackoff(url);

  if (!res.ok) {
    throw new Error(`Semantic Scholar API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.data || !Array.isArray(data.data)) {
    return [];
  }

  return data.data.map((item: any): Paper => {
    const doi = item.externalIds?.DOI || null;
    const s2Id = item.paperId;
    
    return {
      id: doi || s2Id,
      title: item.title,
      authors: (item.authors || []).map((a: any) => ({
        name: a.name,
        id: a.authorId
      })),
      year: item.year || null,
      publishedDate: item.publicationDate || null,
      abstract: item.abstract || null,
      doi: doi,
      venue: item.venue || null,
      citationCount: item.citationCount || 0,
      concepts: (item.s2FieldsOfStudy || []).map((c: any) => c.category).filter(Boolean),
      openAccessUrl: item.openAccessPdf?.url || null,
      isPreprint: false, // Semantic Scholar does not strictly filter this in this endpoint, but we default to false
      sources: [SOURCE_NAME],
      rawSourceIds: {
        [SOURCE_NAME]: s2Id
      }
    };
  });
}

export async function fetchPaperReferencesAndCitations(s2Id: string) {
  // Fetch both references and citations in parallel with backoff
  const fields = "title,paperId,authors";
  
  const [refRes, citRes] = await Promise.all([
    fetchWithBackoff(`https://api.semanticscholar.org/graph/v1/paper/${s2Id}/references?fields=${fields}&limit=50`),
    fetchWithBackoff(`https://api.semanticscholar.org/graph/v1/paper/${s2Id}/citations?fields=${fields}&limit=50`)
  ]);

  let references = [];
  let citations = [];

  if (refRes.ok) {
    const data = await refRes.json();
    references = (data.data || []).filter((d: any) => d.citedPaper && d.citedPaper.paperId).map((d: any) => ({
      id: d.citedPaper.paperId,
      title: d.citedPaper.title,
      isCitation: false
    }));
  }

  if (citRes.ok) {
    const data = await citRes.json();
    citations = (data.data || []).filter((d: any) => d.citingPaper && d.citingPaper.paperId).map((d: any) => ({
      id: d.citingPaper.paperId,
      title: d.citingPaper.title,
      isCitation: true
    }));
  }

  return { references, citations };
}

export async function getRecommendations(s2Id: string, limit: number = 20): Promise<Paper[]> {
  const fields = "title,authors,year,publicationDate,abstract,externalIds,venue,citationCount,isOpenAccess,openAccessPdf,s2FieldsOfStudy";
  const url = `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${s2Id}?limit=${limit}&fields=${fields}`;

  const res = await fetchWithBackoff(url);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Semantic Scholar Recommendations API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.recommendedPapers || !Array.isArray(data.recommendedPapers)) {
    return [];
  }

  return data.recommendedPapers.map((item: any): Paper => {
    const doi = item.externalIds?.DOI || null;
    const paperId = item.paperId;
    
    return {
      id: doi || paperId,
      title: item.title,
      authors: (item.authors || []).map((a: any) => ({
        name: a.name,
        id: a.authorId
      })),
      year: item.year || null,
      publishedDate: item.publicationDate || null,
      abstract: item.abstract || null,
      doi: doi,
      venue: item.venue || null,
      citationCount: item.citationCount || 0,
      concepts: (item.s2FieldsOfStudy || []).map((c: any) => c.category).filter(Boolean),
      openAccessUrl: item.openAccessPdf?.url || null,
      isPreprint: false,
      sources: [SOURCE_NAME],
      rawSourceIds: {
        [SOURCE_NAME]: paperId
      }
    };
  });
}

export async function getPaperDetails(s2Id: string): Promise<Paper | null> {
  const fields = "title,authors,year,publicationDate,abstract,externalIds,venue,citationCount,isOpenAccess,openAccessPdf,s2FieldsOfStudy";
  const url = `https://api.semanticscholar.org/graph/v1/paper/${s2Id}?fields=${fields}`;

  const res = await fetchWithBackoff(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Semantic Scholar Details API error: ${res.status} ${res.statusText}`);
  }

  const item = await res.json();
  if (!item.paperId) return null;

  const doi = item.externalIds?.DOI || null;
  const paperId = item.paperId;
  
  return {
    id: doi || paperId,
    title: item.title,
    authors: (item.authors || []).map((a: any) => ({
      name: a.name,
      id: a.authorId
    })),
    year: item.year || null,
    publishedDate: item.publicationDate || null,
    abstract: item.abstract || null,
    doi: doi,
    venue: item.venue || null,
    citationCount: item.citationCount || 0,
    concepts: (item.s2FieldsOfStudy || []).map((c: any) => c.category).filter(Boolean),
    openAccessUrl: item.openAccessPdf?.url || null,
    isPreprint: false,
    sources: [SOURCE_NAME],
    rawSourceIds: {
      [SOURCE_NAME]: paperId
    }
  };
}

export async function getRabbitHoleExpansion(s2Id: string): Promise<Paper[]> {
  const fields = "title,authors,year,publicationDate,abstract,externalIds,venue,citationCount,isOpenAccess,openAccessPdf,s2FieldsOfStudy";
  
  const [recRes, refRes, citRes] = await Promise.all([
    fetchWithBackoff(`https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${s2Id}?limit=15&fields=${fields}`),
    fetchWithBackoff(`https://api.semanticscholar.org/graph/v1/paper/${s2Id}/references?limit=10&fields=${fields}`),
    fetchWithBackoff(`https://api.semanticscholar.org/graph/v1/paper/${s2Id}/citations?limit=10&fields=${fields}`)
  ]);

  let allPapers: Paper[] = [];
  const seenIds = new Set<string>();
  seenIds.add(s2Id); // Don't include the seed paper itself

  const mapItemToPaper = (item: any): Paper | null => {
    if (!item || !item.paperId) return null;
    if (seenIds.has(item.paperId)) return null;
    
    seenIds.add(item.paperId);
    const doi = item.externalIds?.DOI || null;
    
    return {
      id: doi || item.paperId,
      title: item.title || "Unknown Title",
      authors: (item.authors || []).map((a: any) => ({
        name: a.name,
        id: a.authorId
      })),
      year: item.year || null,
      publishedDate: item.publicationDate || null,
      abstract: item.abstract || null,
      doi: doi,
      venue: item.venue || null,
      citationCount: item.citationCount || 0,
      concepts: (item.s2FieldsOfStudy || []).map((c: any) => c.category).filter(Boolean),
      openAccessUrl: item.openAccessPdf?.url || null,
      isPreprint: false,
      sources: [SOURCE_NAME],
      rawSourceIds: {
        [SOURCE_NAME]: item.paperId
      }
    };
  };

  if (recRes.ok) {
    const data = await recRes.json();
    if (data.recommendedPapers) {
      data.recommendedPapers.forEach((p: any) => {
        const mapped = mapItemToPaper(p);
        if (mapped) allPapers.push(mapped);
      });
    }
  }

  if (refRes.ok) {
    const data = await refRes.json();
    if (data.data) {
      data.data.forEach((d: any) => {
        const mapped = mapItemToPaper(d.citedPaper);
        if (mapped) allPapers.push(mapped);
      });
    }
  }

  if (citRes.ok) {
    const data = await citRes.json();
    if (data.data) {
      data.data.forEach((d: any) => {
        const mapped = mapItemToPaper(d.citingPaper);
        if (mapped) allPapers.push(mapped);
      });
    }
  }

  return allPapers;
}

