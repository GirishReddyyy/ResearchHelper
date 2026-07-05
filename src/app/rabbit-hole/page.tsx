"use client";

import { useState, useMemo } from "react";
import { Paper } from "@/lib/types";
import ResultCard from "@/components/ResultCard";
import styles from "./page.module.css";

export default function RabbitHolePage() {
  const [seedInput, setSeedInput] = useState("");
  const [trail, setTrail] = useState<Paper[]>([]);
  const [results, setResults] = useState<Paper[]>([]);
  
  // Filters
  const [yearMin, setYearMin] = useState<string>("");
  const [yearMax, setYearMax] = useState<string>("");
  const [minCitations, setMinCitations] = useState<string>("");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [peerReviewedOnly, setPeerReviewedOnly] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract concepts only from current results
  const currentConcepts = useMemo(() => {
    const counts = new Map<string, number>();
    results.forEach(p => {
      p.concepts.forEach(c => {
        counts.set(c, (counts.get(c) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Top 15 concepts
      .map(entry => entry[0]);
  }, [results]);

  const runSearch = async (
    params: { seedQuery?: string; seedDoi?: string; overrideDepth?: number },
    currentTrail: Paper[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const depth = params.overrideDepth !== undefined ? params.overrideDepth : currentTrail.length;
      
      const queryParams = new URLSearchParams();
      if (params.seedQuery) queryParams.set("seedQuery", params.seedQuery);
      if (params.seedDoi) queryParams.set("seedDoi", params.seedDoi);
      queryParams.set("depth", depth.toString());
      
      if (yearMin) queryParams.set("yearMin", yearMin);
      if (yearMax) queryParams.set("yearMax", yearMax);
      if (minCitations) queryParams.set("minCitations", minCitations);
      if (openAccessOnly) queryParams.set("openAccessOnly", "true");
      if (peerReviewedOnly) queryParams.set("peerReviewedOnly", "true");
      if (selectedConcept) queryParams.set("concept", selectedConcept);

      const res = await fetch(`/api/rabbit-hole?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch rabbit hole data");
      }

      setResults(data.papers);
      
      // If starting fresh or exploring new, append to trail
      if (params.overrideDepth === undefined) {
        setTrail([...currentTrail, data.seedPaper]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedInput.trim()) return;
    setTrail([]);
    setResults([]);
    setSelectedConcept(null);
    runSearch({ seedQuery: seedInput.trim() }, []);
  };

  const handleExplore = (paper: Paper) => {
    setSelectedConcept(null); // Reset concept filter on new hop
    runSearch({ seedDoi: paper.id }, trail);
  };

  const jumpToHop = (index: number) => {
    const trimmedTrail = trail.slice(0, index);
    const seedDoi = trail[index].id;
    setTrail(trimmedTrail);
    setSelectedConcept(null);
    runSearch({ seedDoi, overrideDepth: index }, trimmedTrail);
  };

  const currentSeed = trail.length > 0 ? trail[trail.length - 1] : null;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h1 className={styles.title}>Rabbit Hole</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Start with a topic or paper, then iteratively explore related research to build your trail.
        </p>

        <form onSubmit={handleInitialSearch} className={styles.inputGroup} style={{ flexDirection: "column" }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter seed topic or DOI..."
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
          />
          <button type="submit" className={styles.button} disabled={isLoading || !seedInput.trim()}>
            Start Journey
          </button>
        </form>

        {trail.length > 0 && (
          <div className={styles.breadcrumbList}>
            <h3 style={{ fontSize: "0.9rem", color: "#fff", margin: "1rem 0 0.5rem 0" }}>Exploration Path</h3>
            {trail.map((paper, index) => (
              <div 
                key={`${paper.id}-${index}`} 
                className={`${styles.breadcrumbItem} ${index === trail.length - 1 ? styles.active : ""}`}
                onClick={() => jumpToHop(index)}
              >
                <div className={styles.breadcrumbDot} />
                <div className={styles.breadcrumbText}>
                  {paper.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className={styles.mainContent}>
        {/* Filters */}
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Year Range:</label>
              <input type="number" placeholder="Min" className={styles.filterInput} value={yearMin} onChange={e => setYearMin(e.target.value)} />
              <span>-</span>
              <input type="number" placeholder="Max" className={styles.filterInput} value={yearMax} onChange={e => setYearMax(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <label>Min Citations:</label>
              <input type="number" placeholder="0" className={styles.filterInput} value={minCitations} onChange={e => setMinCitations(e.target.value)} />
            </div>
            <div className={styles.filterGroup}>
              <input type="checkbox" className={styles.checkbox} checked={openAccessOnly} onChange={e => setOpenAccessOnly(e.target.checked)} id="oa" />
              <label htmlFor="oa">Open Access Only</label>
            </div>
            <div className={styles.filterGroup}>
              <input type="checkbox" className={styles.checkbox} checked={peerReviewedOnly} onChange={e => setPeerReviewedOnly(e.target.checked)} id="pr" />
              <label htmlFor="pr">Exclude Preprints</label>
            </div>
            {(yearMin || yearMax || minCitations || openAccessOnly || peerReviewedOnly || selectedConcept) && (
              <button 
                onClick={() => {
                   if (currentSeed) {
                     runSearch({ seedDoi: currentSeed.id, overrideDepth: trail.length - 1 }, trail.slice(0, trail.length - 1));
                   }
                }}
                style={{ background: "transparent", border: "1px solid var(--rh-border)", color: "#fff", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.8rem" }}
              >
                Apply Filters
              </button>
            )}
          </div>
          
          {currentConcepts.length > 0 && (
            <div className={styles.conceptChips}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", alignSelf: "center" }}>Concepts:</span>
              {currentConcepts.map(c => (
                <button
                  key={c}
                  className={`${styles.chip} ${selectedConcept === c ? styles.active : ""}`}
                  onClick={() => setSelectedConcept(selectedConcept === c ? null : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ color: "var(--rh-pink)", background: "rgba(236, 72, 153, 0.1)", padding: "1rem", borderRadius: "0.5rem" }}>{error}</div>}
        
        {isLoading && <div style={{ textAlign: "center", color: "var(--rh-purple)", padding: "2rem" }}>Exploring the rabbit hole...</div>}

        {!isLoading && currentSeed && (
          <div className={styles.feed}>
            <div className={styles.hopIndicator}>
              Hop {trail.length - 1}: Seed Paper
            </div>
            <div className={styles.seedCard}>
              <ResultCard paper={currentSeed} index={0} />
            </div>
            
            <div className={styles.hopIndicator}>
              Expanding outward... ({results.length} results)
            </div>
            
            {results.map((paper, idx) => (
              <ResultCard 
                key={`${paper.id}-${idx}`} 
                paper={paper} 
                index={idx + 1} 
                onExplore={handleExplore}
              />
            ))}
            
            {results.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                No more results to explore down this path. Try adjusting filters or jumping back.
              </div>
            )}
          </div>
        )}

        {!isLoading && !currentSeed && trail.length === 0 && !error && (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", border: "1px dashed var(--rh-border)", borderRadius: "1rem" }}>
            Enter a topic on the left to start exploring.
          </div>
        )}
      </main>
    </div>
  );
}
