import { NextResponse } from 'next/server';
import { fetchPaperReferencesAndCitations } from '@/lib/sources/semanticScholar';

export async function POST(request: Request) {
  try {
    const { s2Ids, seedTitles } = await request.json();

    if (!s2Ids || !Array.isArray(s2Ids) || s2Ids.length === 0) {
      return NextResponse.json({ error: 's2Ids array is required' }, { status: 400 });
    }

    const nodesMap = new Map<string, { id: string, name: string, group: number, val: number }>();
    const linksMap = new Map<string, { source: string, target: string, type: 'cites' }>();

    // 1. Add all seed nodes (the papers in the library)
    s2Ids.forEach((id: string, index: number) => {
      nodesMap.set(id, { 
        id, 
        name: seedTitles[id] || `Seed Paper ${index + 1}`, 
        group: 1, // 1 = Seed paper
        val: 10   // Larger visual node
      });
    });

    // 2. Fetch references and citations for all seeds concurrently
    const results = await Promise.allSettled(
      s2Ids.map(id => fetchPaperReferencesAndCitations(id))
    );

    // 3. Process results and build the graph
    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        const seedId = s2Ids[idx];
        const { references, citations } = res.value;

        // Process references (Seed cites -> Ref)
        references.forEach((ref: any) => {
          if (!nodesMap.has(ref.id)) {
            nodesMap.set(ref.id, { id: ref.id, name: ref.title, group: 2, val: 3 });
          } else {
            // Increase node size slightly if it's connected multiple times
            nodesMap.get(ref.id)!.val += 1;
          }
          const linkKey = `${seedId}->${ref.id}`;
          linksMap.set(linkKey, { source: seedId, target: ref.id, type: 'cites' });
        });

        // Process citations (Cit cites -> Seed)
        citations.forEach((cit: any) => {
          if (!nodesMap.has(cit.id)) {
            nodesMap.set(cit.id, { id: cit.id, name: cit.title, group: 3, val: 3 });
          } else {
            nodesMap.get(cit.id)!.val += 1;
          }
          const linkKey = `${cit.id}->${seedId}`;
          linksMap.set(linkKey, { source: cit.id, target: seedId, type: 'cites' });
        });
      }
    });

    // Clean up nodes with very low connectivity to keep the graph readable
    // If it's not a seed node and its size didn't increase (only 1 connection), we might filter it out if there are too many.
    // For now, let's limit total nodes if it exceeds 200 to prevent browser lag.
    let finalNodes = Array.from(nodesMap.values());
    if (finalNodes.length > 250) {
      finalNodes = finalNodes.sort((a, b) => b.val - a.val).slice(0, 250);
    }

    const finalNodeIds = new Set(finalNodes.map(n => n.id));
    const finalLinks = Array.from(linksMap.values()).filter(
      l => finalNodeIds.has(l.source) && finalNodeIds.has(l.target)
    );

    return NextResponse.json({
      nodes: finalNodes,
      links: finalLinks
    });

  } catch (error: any) {
    console.error("Citation Graph API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
