"use client";

import { useState, useEffect } from "react";
import { Paper } from "@/lib/types";
import styles from "../app/page.module.css";

export default function ResultCard({ paper, index, onExplore }: { paper: Paper; index: number; onExplore?: (paper: Paper) => void }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/library/${encodeURIComponent(paper.id)}`)
      .then(res => res.json())
      .then(data => setIsSaved(data.saved))
      .catch(err => console.error("Error checking saved status", err));
  }, [paper.id]);

  const toggleSave = async () => {
    try {
      if (isSaved) {
        await fetch(`/api/library/${encodeURIComponent(paper.id)}`, { method: "DELETE" });
        setIsSaved(false);
      } else {
        // Shared backend - get researcher name once
        let researcherName = localStorage.getItem("researcherName");
        if (!researcherName) {
          researcherName = prompt("Enter your name to share with the group:") || "Anonymous Researcher";
          localStorage.setItem("researcherName", researcherName);
        }

        const paperToSave = { ...paper, savedBy: researcherName };
        
        await fetch(`/api/library`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paperToSave)
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Failed to toggle save", err);
      alert("Failed to update library.");
    }
  };

  return (
    <article 
      className={styles.card}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <h2 className={styles.cardTitle} style={{ flex: 1 }}>{paper.title}</h2>
        <button 
          onClick={toggleSave}
          style={{
            background: isSaved ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.05)",
            color: isSaved ? "#6ee7b7" : "var(--text-secondary)",
            border: `1px solid ${isSaved ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
            padding: "0.4rem 0.8rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.85rem",
            transition: "all 0.2s"
          }}
        >
          {isSaved ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      <div className={styles.cardMeta}>
        <span>📅 {paper.publishedDate || paper.year || "Unknown Date"}</span>
        <span>👥 {paper.authors?.map(a => a.name).slice(0, 3).join(", ") || "Unknown Authors"} {paper.authors?.length > 3 && "et al."}</span>
        {paper.venue && <span>📍 {paper.venue}</span>}
        {paper.citationCount > 0 && <span>⭐ Cited by {paper.citationCount}</span>}
      </div>
      
      {paper.abstract && (
        <div className={styles.cardAbstract}>
          {paper.abstract}
        </div>
      )}
      
      <div className={styles.cardFooter}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {paper.savedBy && (
            <span style={{ background: "rgba(255, 255, 255, 0.1)", color: "var(--text-primary)", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>
              👤 Saved by {paper.savedBy}
            </span>
          )}
          {paper.sources.map(s => (
            <span key={s} style={{ background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>
              {s}
            </span>
          ))}
          {paper.openAccessUrl && (
            <a href={paper.openAccessUrl} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>
              🔓 PDF
            </a>
          )}
          {paper.isPreprint && (
            <span style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fcd34d", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>
              Preprint
            </span>
          )}
        </div>
        <a 
          href={paper.doi ? `https://doi.org/${paper.doi}` : "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.readMore}
          style={{ visibility: paper.doi ? "visible" : "hidden" }}
        >
          DOI Link
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        
        {onExplore && (
          <button
            onClick={() => onExplore(paper)}
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(99,102,241,0.15) 100%)",
              color: "#a855f7",
              border: "1px solid #a855f7",
              padding: "0.4rem 0.8rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            Explore →
          </button>
        )}
      </div>
    </article>
  );
}
