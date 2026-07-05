import { Paper } from "../types";

export const SOURCE_NAME = "arXiv";

export async function searchArxiv(query: string, limit: number = 10): Promise<Paper[]> {
  // arXiv uses a specific query format and returns XML. We will fetch and do a basic regex/string parse.
  // In production, an XML parser like fast-xml-parser should be used, but this works for basic nodes.
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`arXiv API error: ${res.status} ${res.statusText}`);
  }

  const xmlText = await res.text();
  
  // Basic XML parsing with regex (sufficient for arXiv's flat atom feed structure for basic fields)
  const entries = xmlText.split("<entry>").slice(1); // skip header
  
  return entries.map((entry): Paper => {
    const extractNode = (node: string) => {
      const match = entry.match(new RegExp(`<${node}[^>]*>([\\s\\S]*?)</${node}>`, "i"));
      return match ? match[1].trim() : null;
    };

    const idUrl = extractNode("id") || "";
    const id = idUrl.split("/abs/")[1] || idUrl;
    
    // Extract multiple authors
    const authorMatches = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)];
    const authors = authorMatches.map(m => ({ name: m[1].trim() }));

    const publishedDate = extractNode("published");
    const year = publishedDate ? parseInt(publishedDate.substring(0, 4)) : null;

    // Categories
    const categoryMatches = [...entry.matchAll(/<category term="([^"]+)"/gi)];
    const concepts = categoryMatches.map(m => m[1]);

    const pdfMatch = entry.match(/<link title="pdf" href="([^"]+)"/i);
    const openAccessUrl = pdfMatch ? pdfMatch[1] : (idUrl.replace("abs", "pdf") + ".pdf");

    return {
      id: `arxiv-${id}`,
      title: (extractNode("title") || "Unknown Title").replace(/\n/g, " ").replace(/\s+/g, " "),
      authors: authors,
      year: year,
      publishedDate: publishedDate?.split("T")[0] || null,
      abstract: (extractNode("summary") || "").replace(/\n/g, " ").replace(/\s+/g, " "),
      doi: extractNode("arxiv:doi") || null, // sometimes provided via arxiv:doi
      venue: "arXiv",
      citationCount: 0, // arXiv doesn't provide citation counts natively
      concepts: concepts,
      openAccessUrl: openAccessUrl,
      isPreprint: true, // arXiv is always a preprint
      sources: [SOURCE_NAME],
      rawSourceIds: {
        [SOURCE_NAME]: id
      }
    };
  });
}
