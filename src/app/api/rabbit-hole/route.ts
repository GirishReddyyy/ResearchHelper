import { NextResponse } from 'next/server';
import { searchSemanticScholar, getPaperDetails, getRabbitHoleExpansion } from '@/lib/sources/semanticScholar';
import { Paper } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seedDoi = searchParams.get('seedDoi');
    const seedTitle = searchParams.get('seedTitle');
    const seedQuery = searchParams.get('seedQuery');
    const depth = parseInt(searchParams.get('depth') || '0', 10);
    
    // Filters
    const yearMin = searchParams.has('yearMin') ? parseInt(searchParams.get('yearMin')!, 10) : null;
    const yearMax = searchParams.has('yearMax') ? parseInt(searchParams.get('yearMax')!, 10) : null;
    const minCitations = searchParams.has('minCitations') ? parseInt(searchParams.get('minCitations')!, 10) : null;
    const openAccessOnly = searchParams.get('openAccessOnly') === 'true';
    const peerReviewedOnly = searchParams.get('peerReviewedOnly') === 'true';
    const concept = searchParams.get('concept');

    if (!seedDoi && !seedTitle && !seedQuery) {
      return NextResponse.json({ error: 'Must provide seedDoi, seedTitle, or seedQuery' }, { status: 400 });
    }

    let seedPaper: Paper | null = null;
    let s2IdToExpand = seedDoi;

    // 1. Resolve Seed Paper
    if (seedDoi) {
      seedPaper = await getPaperDetails(seedDoi);
      if (!seedPaper) {
         // Fallback to title search if details failed
         if (seedTitle) {
             const results = await searchSemanticScholar(seedTitle, 1);
             if (results.length > 0) seedPaper = results[0];
         }
      }
    } else if (seedQuery || seedTitle) {
      const q = seedQuery || seedTitle;
      const results = await searchSemanticScholar(q!, 1);
      if (results.length > 0) seedPaper = results[0];
    }

    if (!seedPaper) {
      return NextResponse.json({ error: 'Could not resolve seed paper' }, { status: 404 });
    }

    // Semantic Scholar API uses the rawSourceIds we stored
    s2IdToExpand = seedPaper.rawSourceIds?.['Semantic Scholar'] || seedPaper.id;

    // 2. Fetch Expansion (Recommendations, References, Citations)
    let expandedPapers = await getRabbitHoleExpansion(s2IdToExpand);

    // 3. Apply Filters
    let filteredPapers = expandedPapers.filter(paper => {
      if (yearMin !== null && paper.year && paper.year < yearMin) return false;
      if (yearMax !== null && paper.year && paper.year > yearMax) return false;
      if (minCitations !== null && paper.citationCount < minCitations) return false;
      if (openAccessOnly && !paper.openAccessUrl) return false;
      if (peerReviewedOnly && paper.isPreprint) return false;
      if (concept && !paper.concepts.some(c => c.toLowerCase() === concept.toLowerCase())) return false;
      return true;
    });

    return NextResponse.json({
      seedPaper,
      papers: filteredPapers,
      hopDepth: depth
    });

  } catch (error: any) {
    console.error('Rabbit Hole API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
