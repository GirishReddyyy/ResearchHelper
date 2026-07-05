import { Paper } from "../types";

export const SOURCE_NAME = "CrossRef";
const POLITE_EMAIL = "bot@researchhelper.example.com"; // Replace with real email if deployed

export async function searchCrossRef(query: string, limit: number = 10): Promise<Paper[]> {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&mailto=${POLITE_EMAIL}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": `ResearchHelperBot/1.0 (mailto:${POLITE_EMAIL})`
    }
  });

  if (!res.ok) {
    throw new Error(`CrossRef API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.message || !data.message.items) {
    return [];
  }

  return data.message.items.map((item: any): Paper => {
    const doi = item.DOI || null;
    
    // Extract authors
    const authors = (item.author || []).map((a: any) => ({
      name: `${a.given || ""} ${a.family || ""}`.trim(),
      id: a.ORCID || undefined
    })).filter((a: any) => a.name !== "");

    // Extract date
    let year = null;
    let publishedDate = null;
    const dateParts = item.published?.["date-parts"]?.[0] || item.created?.["date-parts"]?.[0];
    if (dateParts && dateParts.length > 0) {
      year = dateParts[0];
      if (dateParts.length === 3) {
        publishedDate = `${dateParts[0]}-${String(dateParts[1]).padStart(2, "0")}-${String(dateParts[2]).padStart(2, "0")}`;
      } else if (dateParts.length === 2) {
        publishedDate = `${dateParts[0]}-${String(dateParts[1]).padStart(2, "0")}`;
      } else {
        publishedDate = String(dateParts[0]);
      }
    }

    const venue = item["container-title"]?.[0] || null;
    const openAccessUrl = item.link?.find((l: any) => l["intended-application"] === "text-mining")?.URL || null;

    return {
      id: doi || `crossref-${item.URL}`,
      title: item.title?.[0] || "Unknown Title",
      authors: authors,
      year: year,
      publishedDate: publishedDate,
      abstract: item.abstract || null,
      doi: doi,
      venue: venue,
      citationCount: item["is-referenced-by-count"] || 0,
      concepts: item.subject || [], // CrossRef often provides 'subject'
      openAccessUrl: openAccessUrl,
      isPreprint: item.subtype === "preprint",
      sources: [SOURCE_NAME],
      rawSourceIds: {
        [SOURCE_NAME]: doi
      }
    };
  });
}
