import { NextResponse } from 'next/server';
import { searchSemanticScholar } from '@/lib/sources/semanticScholar';
import { searchCrossRef } from '@/lib/sources/crossref';
import { dedupePapers } from '@/lib/utils/dedupe';
import { Paper } from '@/lib/types';

// Helper to wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, sourceName: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Timeout fetching from ${sourceName} after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutHandle));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  // We are currently integrating Semantic Scholar and CrossRef in the primary blocking fan-out
  // arXiv is pulled out of this blocking path as requested (can be fetched via a separate client call)
  
  const sources = [
    { name: 'Semantic Scholar', promise: searchSemanticScholar(query, 15) },
    { name: 'CrossRef', promise: searchCrossRef(query, 15) }
  ];

  // Set a strict 6-second timeout per source so the UI doesn't hang
  const timeoutMs = 6000;

  const results = await Promise.allSettled(
    sources.map(s => withTimeout(s.promise, timeoutMs, s.name))
  );

  const errors: string[] = [];
  let allPapers: Paper[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allPapers = allPapers.concat(result.value);
    } else {
      console.error(`Source ${sources[index].name} failed:`, result.reason);
      errors.push(sources[index].name);
    }
  });

  // Deduplicate results only after all sources resolve
  const mergedAndRanked = dedupePapers(allPapers);

  return NextResponse.json({
    data: mergedAndRanked,
    errors: errors.length > 0 ? errors : undefined,
    meta: {
      totalFound: mergedAndRanked.length,
      sourcesAttempted: sources.length,
      sourcesSucceeded: sources.length - errors.length
    }
  });
}
