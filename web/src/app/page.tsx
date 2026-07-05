"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Paper } from "@/lib/types";
import ResultCard from "@/components/ResultCard";
import Link from "next/link";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [meta, setMeta] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setErrors([]);
    setMeta(null);
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.data) {
        setResults(data.data);
      }
      if (data.errors) {
        setErrors(data.errors);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Research Helper</h1>
        <p className={styles.subtitle}>Unified fan-out search across major academic databases.</p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/library" style={{ color: "var(--accent-color)", textDecoration: "none", fontWeight: 500 }}>
            📚 View Saved Library
          </Link>
          <span style={{ color: "var(--glass-border)" }}>|</span>
          <Link href="/journal-finder" style={{ color: "var(--accent-color)", textDecoration: "none", fontWeight: 500 }}>
            🧭 Journal Finder AI
          </Link>
          <span style={{ color: "var(--glass-border)" }}>|</span>
          <Link href="/gap-analysis" style={{ color: "var(--accent-color)", textDecoration: "none", fontWeight: 500 }}>
            🔬 Gap Analysis
          </Link>
          <span style={{ color: "var(--glass-border)" }}>|</span>
          <Link href="/citation-graph" style={{ color: "var(--accent-color)", textDecoration: "none", fontWeight: 500 }}>
            🕸️ Citation Graph
          </Link>
        </div>
      </div>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search for papers, authors, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          type="submit" 
          className={styles.searchButton} 
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <span className={styles.loader}></span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          )}
        </button>
      </form>

      {errors.length > 0 && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", width: "100%" }}>
          <p style={{ color: "#f87171", fontSize: "0.9rem" }}>⚠️ The following sources were unavailable or timed out: {errors.join(", ")}</p>
        </div>
      )}

      {meta && (
        <div style={{ marginBottom: "1.5rem", width: "100%", textAlign: "left", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Found {meta.totalFound} results from {meta.sourcesSucceeded}/{meta.sourcesAttempted} sources.
        </div>
      )}

      <div className={styles.results}>
        {loading && <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Querying sources & deduplicating results...</p>}
        
        {!loading && hasSearched && results.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>No results found for "{query}". Try different keywords.</p>
        )}

        {!loading && results.map((paper, index) => (
          <ResultCard key={paper.id} paper={paper} index={index} />
        ))}
      </div>
    </main>
  );
}
