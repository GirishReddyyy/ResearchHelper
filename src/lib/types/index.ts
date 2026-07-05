export interface Author {
  name: string;
  id?: string;
}

export interface Paper {
  id: string;              // Internal unique ID (DOI if available, otherwise source ID)
  title: string;
  authors: Author[];
  year: number | null;
  publishedDate: string | null; // Full date if available (YYYY-MM-DD format ideally)
  abstract: string | null;
  doi: string | null;
  venue: string | null;    // Journal Name or Conference Name
  citationCount: number;
  concepts: string[];      // Topics / Keywords
  openAccessUrl: string | null;
  isPreprint: boolean;
  sources: string[];       // e.g., ["Semantic Scholar", "CrossRef", "arXiv"]
  rawSourceIds: Record<string, string>; // e.g., { "Semantic Scholar": "...", "CrossRef": "..." }
  savedBy?: string;
}

export interface Journal {
  name: string;
  publisher: string | null;
  issn: string[];
  worksCountInTopic: number;
  isOpenAccess: boolean;   // Verified via DOAJ
  sampleArticles: Paper[];
  dominantConcepts: string[];
  scimagoLookupUrl: string; // Auto-generated: https://www.scimagojr.com/journalsearch.php?q={name}
}
