"use client";

import { useState, useEffect } from "react";
import { Paper } from "@/lib/types";
import { generateBibTeX, generateRIS, downloadStringAsFile } from "@/lib/utils/export";
import ResultCard from "@/components/ResultCard";
import Link from "next/link";
import styles from "./page.module.css";

export default function LibraryPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      if (data.papers) {
        setPapers(data.papers.sort((a: Paper, b: Paper) => b.citationCount - a.citationCount));
      }
    } catch (err) {
      console.error("Failed to fetch library", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const handleExportBibTeX = () => {
    if (papers.length === 0) return;
    const bibtex = generateBibTeX(papers);
    downloadStringAsFile(bibtex, "library.bib", "text/plain");
  };

  const handleExportRIS = () => {
    if (papers.length === 0) return;
    const ris = generateRIS(papers);
    downloadStringAsFile(ris, "library.ris", "text/plain");
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
            &larr; Back to Search
          </Link>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={handleExportBibTeX} 
              disabled={papers.length === 0}
              className={styles.exportButton}
            >
              Export BibTeX
            </button>
            <button 
              onClick={handleExportRIS} 
              disabled={papers.length === 0}
              className={styles.exportButton}
            >
              Export RIS
            </button>
          </div>
        </div>
        
        <h1 className={styles.title} style={{ marginTop: "2rem" }}>Saved Library</h1>
        <p className={styles.subtitle}>You have {papers.length} saved papers in your collection.</p>
      </div>

      <div className={styles.results}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading library...</p>
        ) : papers.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "4rem" }}>
            <p>Your library is empty.</p>
            <Link href="/" style={{ color: "var(--accent-color)", textDecoration: "none", marginTop: "1rem", display: "inline-block" }}>
              Start searching for papers
            </Link>
          </div>
        ) : (
          papers.map((paper, index) => (
            <div key={paper.id} style={{ position: "relative" }}>
              <ResultCard paper={paper} index={index} />
              {/* Optional: Add a listener here or just rely on the component's internal state. 
                  If a user unsaves it, they can refresh to see it removed. */}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
