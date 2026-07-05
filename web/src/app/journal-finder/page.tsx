"use client";

import { useState } from "react";
import Link from "next/link";
import { Journal } from "@/lib/types";
import styles from "./page.module.css";

interface SynthesisData {
  subAreas: {
    name: string;
    journals: {
      name: string;
      editorialNote: string;
    }[];
  }[];
  bestFits: {
    name: string;
    reasoning: string;
  }[];
}

export default function JournalFinderPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [synthesis, setSynthesis] = useState<SynthesisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
    setSynthesis(null);
    setJournals([]);
    
    try {
      const res = await fetch(`/api/journals?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch journals");
      }
      
      setJournals(data.journals || []);
      setSynthesis(data.synthesis || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getJournalData = (name: string) => {
    return journals.find(j => j.name === name);
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
            &larr; Back to Search
          </Link>
        </div>
        <h1 className={styles.title} style={{ marginTop: "2rem" }}>Journal Finder</h1>
        <p className={styles.subtitle}>Discover candidate journals for your next paper, verified against open access databases.</p>
      </div>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Enter your research topic or abstract..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button 
          type="submit" 
          className={styles.searchButton} 
          disabled={loading || !topic.trim()}
        >
          {loading ? <span className={styles.loader}></span> : "Analyze"}
        </button>
      </form>

      {error && (
        <div className={styles.errorBox}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "2rem" }}>
          <span className={styles.loader} style={{ display: "inline-block", marginRight: "1rem" }}></span>
          Aggregating CrossRef data, checking DOAJ, and synthesizing with OpenAI...
        </div>
      )}

      {!loading && synthesis && (
        <div className={styles.results}>
          
          <div className={styles.bestFitsPanel}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>⭐ Top Recommendations</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {synthesis.bestFits.map((fit, idx) => {
                const jData = getJournalData(fit.name);
                return (
                  <div key={idx} className={styles.bestFitCard}>
                    <h3 style={{ fontSize: "1.2rem", color: "var(--accent-color)" }}>{fit.name}</h3>
                    <p style={{ fontSize: "0.95rem", marginTop: "0.5rem", color: "var(--text-secondary)" }}>{fit.reasoning}</p>
                    
                    {jData && (
                      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        {jData.isOpenAccess && <span className={styles.oaBadge}>🔓 Verified OA</span>}
                        <a href={jData.scimagoLookupUrl} target="_blank" rel="noopener noreferrer" className={styles.verifyLink}>
                          Verify Indexing Status (Scimago) &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "3rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem", textAlign: "center" }}>Candidate Sub-Areas</h2>
            
            {synthesis.subAreas.map((area, idx) => (
              <div key={idx} className={styles.subAreaSection}>
                <h3 className={styles.subAreaTitle}>{area.name}</h3>
                
                <div className={styles.journalGrid}>
                  {area.journals.map((j, jidx) => {
                    const jData = getJournalData(j.name);
                    return (
                      <div key={jidx} className={styles.journalCard}>
                        <h4 className={styles.journalTitle}>{j.name}</h4>
                        <p className={styles.journalNote}>{j.editorialNote}</p>
                        
                        {jData && (
                          <div style={{ marginTop: "1rem" }}>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                              Concepts: {jData.dominantConcepts.join(", ") || "N/A"}
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem" }}>
                              {jData.isOpenAccess && <span className={styles.oaBadge}>🔓 DOAJ OA</span>}
                              <a href={jData.scimagoLookupUrl} target="_blank" rel="noopener noreferrer" className={styles.verifyLink}>
                                Scimago &rarr;
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </main>
  );
}
