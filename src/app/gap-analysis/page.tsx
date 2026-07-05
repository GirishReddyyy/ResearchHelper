"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./page.module.css";

// Force graph relies on window and canvas, so we must disable SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function GapAnalysisPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const res = await fetch(`/api/gaps?topic=${encodeURIComponent(topic)}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch gap analysis data");
      }
      
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
            &larr; Back to Search
          </Link>
        </div>
        <h1 className={styles.title} style={{ marginTop: "2rem" }}>Research Gap Analysis</h1>
        <p className={styles.subtitle}>Discover unmade connections and temporal trends in your field purely from data.</p>
      </div>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Enter a research topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button 
          type="submit" 
          className={styles.searchButton} 
          disabled={loading || !topic.trim()}
        >
          {loading ? <span className={styles.loader}></span> : "Analyze Gaps"}
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
          Fetching 50+ papers, computing force graphs, and synthesizing report...
        </div>
      )}

      {!loading && data && (
        <div className={styles.resultsGrid}>
          
          {/* Top Row: Visualizations */}
          <div className={styles.visualsContainer}>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Temporal Trajectory</h3>
              <div style={{ width: "100%", height: 300, marginTop: "2rem" }}>
                <ResponsiveContainer>
                  <BarChart data={data.temporalData}>
                    <XAxis dataKey="year" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-border)', borderRadius: '0.5rem' }} 
                    />
                    <Bar dataKey="count" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Concept Co-occurrence Map</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Nodes represent popular concepts. Edges represent papers combining them. Sparse areas between large nodes signify unmade connections.
              </p>
              <div className={styles.graphWrapper}>
                <ForceGraph2D
                  graphData={data.graph}
                  width={500}
                  height={300}
                  nodeLabel="id"
                  nodeColor={() => "#6366f1"}
                  nodeRelSize={6}
                  linkColor={() => "rgba(255, 255, 255, 0.1)"}
                  linkWidth={(link: any) => Math.sqrt(link.weight)}
                  backgroundColor="transparent"
                />
              </div>
            </div>

          </div>

          {/* Bottom Row: AI Synthesis */}
          {data.gapReport && (
            <div className={styles.reportPanel}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--text-primary)" }}>
                AI Gap Synthesis Report
              </h2>
              
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ color: "var(--accent-color)", marginBottom: "0.5rem" }}>Overall Trajectory</h4>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{data.gapReport.summary}</p>
              </div>

              <div>
                <h4 style={{ color: "var(--accent-color)", marginBottom: "1rem" }}>Identified Opportunities</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {data.gapReport.identifiedGaps?.map((gap: any, i: number) => (
                    <div key={i} className={styles.gapCard}>
                      <h5 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{gap.title}</h5>
                      <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{gap.description}</p>
                    </div>
                  ))}
                  {(!data.gapReport.identifiedGaps || data.gapReport.identifiedGaps.length === 0) && (
                    <p style={{ color: "var(--text-secondary)" }}>No distinct sparse connections identified in this sample set.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  );
}
