import { Paper } from "../types";

function generateCitationKey(paper: Paper): string {
  const firstAuthor = paper.authors[0]?.name?.split(" ").pop() || "Unknown";
  const year = paper.year || "ND";
  const firstWord = paper.title?.split(" ")[0]?.replace(/[^a-zA-Z]/g, "") || "Title";
  return `${firstAuthor}${year}${firstWord}`.toLowerCase();
}

export function generateBibTeX(papers: Paper[]): string {
  return papers.map(paper => {
    const key = generateCitationKey(paper);
    const authorStr = paper.authors.map(a => a.name).join(" and ") || "Unknown Author";
    
    // Safely handle nulls
    const title = paper.title ? `{${paper.title}}` : `{Unknown Title}`;
    const year = paper.year ? `  year = {${paper.year}},\n` : "";
    const journal = paper.venue ? `  journal = {${paper.venue}},\n` : "";
    const doi = paper.doi ? `  doi = {${paper.doi}},\n` : "";
    const url = paper.openAccessUrl ? `  url = {${paper.openAccessUrl}},\n` : "";
    
    return `@article{${key},
  title = ${title},
  author = {${authorStr}},
${year}${journal}${doi}${url}}`;
  }).join("\n\n");
}

export function generateRIS(papers: Paper[]): string {
  return papers.map(paper => {
    let ris = "TY  - JOUR\n";
    ris += `TI  - ${paper.title || "Unknown Title"}\n`;
    
    paper.authors.forEach(a => {
      ris += `AU  - ${a.name}\n`;
    });
    
    if (paper.year) ris += `PY  - ${paper.year}\n`;
    if (paper.publishedDate) ris += `DA  - ${paper.publishedDate.replace(/-/g, "/")}\n`;
    if (paper.venue) ris += `JO  - ${paper.venue}\n`;
    if (paper.doi) ris += `DO  - ${paper.doi}\n`;
    if (paper.openAccessUrl) ris += `UR  - ${paper.openAccessUrl}\n`;
    if (paper.abstract) ris += `AB  - ${paper.abstract}\n`;
    
    ris += "ER  - ";
    return ris;
  }).join("\n\n");
}

export function downloadStringAsFile(content: string, filename: string, mimeType: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
