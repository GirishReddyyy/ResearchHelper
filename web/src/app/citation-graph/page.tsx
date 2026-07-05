"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Paper } from "@/lib/types";
import styles from "./page.module.css";

// Force graph relies on window and canvas, so we must disable SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function CitationGraphPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const libRes = await fetch("/api/library");
      const libData = await libRes.json();
      const savedPapers: Paper[] = libData.papers || [];
      
      // Filter to only those with Semantic Scholar rawSourceIds
      const s2Papers = savedPapers.filter(p => p.rawSourceIds && p.rawSourceIds["Semantic Scholar"]);
      
      if (s2Papers.length === 0) {
        throw new Error("You must save at least one paper that originated from Semantic Scholar to build a citation graph.");
      }

      const s2Ids = s2Papers.map(p => p.rawSourceIds["Semantic Scholar"]);
      const seedTitles: Record<string, string> = {};
      s2Papers.forEach(p => {
        seedTitles[p.rawSourceIds["Semantic Scholar"]] = p.title;
      });

      const res = await fetch(`/api/citations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s2Ids, seedTitles })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch citation data");
      }
      
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
            &larr; Back to Search
          </Link>
          <Link href="/library" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
            View Library &rarr;
          </Link>
        </div>
        <h1 className={styles.title} style={{ marginTop: "2rem" }}>Citation Graph</h1>
        <p className={styles.subtitle}>A network of real references and citations stemming from your saved library.</p>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "4rem" }}>
          <span className={styles.loader} style={{ display: "inline-block", marginRight: "1rem" }}></span>
          Mapping reference node network... this may take a moment.
        </div>
      )}

      {!loading && data && (
        <div className={styles.visualsContainer}>
          <div className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 className={styles.cardTitle}>Network Topology</h3>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#6366f1" }}></span> Seed Papers</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#10b981" }}></span> References</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }}></span> Citing Papers</span>
              </div>
            </div>
            
            <div className={styles.graphWrapper}>
              <ForceGraph2D
                graphData={data}
                width={900}
                height={500}
                nodeLabel="name"
                nodeColor={(node: any) => {
                  if (node.group === 1) return "#6366f1"; // Seed
                  if (node.group === 2) return "#10b981"; // Ref
                  if (node.group === 3) return "#f59e0b"; // Cit
                  return "#94a3b8";
                }}
                nodeRelSize={4}
                linkColor={() => "rgba(255, 255, 255, 0.15)"}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                backgroundColor="transparent"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
