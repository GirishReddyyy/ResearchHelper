import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Quote, Copy, Check, Download, BookOpen } from 'lucide-react';

const FORMATS = ['apa', 'mla', 'ieee', 'chicago'];

export default function CitationsPage() {
  const [papers, setPapers] = useState([]);
  const [format, setFormat] = useState('apa');
  const [citations, setCitations] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/papers?limit=100').then(({ data }) => {
      setPapers(data.papers);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (papers.length === 0) return;
    api.post('/citations/batch', { paperIds: papers.map(p => p._id), format })
      .then(({ data }) => {
        const map = {};
        data.citations.forEach(c => { map[c.paperId] = c.citation; });
        setCitations(map);
      });
  }, [format, papers]);

  const copyOne = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportBib = async () => {
    try {
      const res = await api.post('/citations/bibtex', { paperIds: papers.map(p => p._id) }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'references.bib';
      a.click();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Citations</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Generate and export citations in multiple formats</p>
        </div>
        <button onClick={exportBib} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <Download size={16} /> Export BibTeX
        </button>
      </div>

      {/* Format Selector */}
      <div className="flex gap-2">
        {FORMATS.map((f) => (
          <button key={f} onClick={() => setFormat(f)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all uppercase"
            style={{
              background: format === f ? 'var(--color-accent-blue)' : 'var(--color-bg-card)',
              color: format === f ? 'white' : 'var(--color-text-secondary)',
              border: `1px solid ${format === f ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Citations List */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
          papers.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>No papers to cite. Search for papers first!</p>
            </div>
          ) :
          papers.map((paper) => (
            <motion.div key={paper._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{paper.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {citations[paper._id] || 'Generating...'}
                  </p>
                </div>
                <button onClick={() => copyOne(paper._id, citations[paper._id])}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 flex-shrink-0"
                  style={{ color: copiedId === paper._id ? 'var(--color-accent-green)' : 'var(--color-text-secondary)' }}>
                  {copiedId === paper._id ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
}
