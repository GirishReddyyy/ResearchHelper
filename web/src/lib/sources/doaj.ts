export async function checkDoajIsOA(journalName: string): Promise<boolean> {
  if (!journalName) return false;
  
  try {
    // DOAJ v2 search journals by exact title match (or close enough)
    const query = encodeURIComponent(`title:"${journalName}"`);
    const url = `https://doaj.org/api/v2/search/journals/${query}?pageSize=1`;
    
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      // Optional: fast timeout since we do this in a batch
      signal: AbortSignal.timeout(3000) 
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    return data.total > 0;
  } catch (error) {
    console.error(`DOAJ lookup failed for ${journalName}:`, error);
    return false;
  }
}
