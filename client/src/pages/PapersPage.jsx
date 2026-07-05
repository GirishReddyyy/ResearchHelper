import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { BookOpen, Search, ExternalLink, Award, Calendar, Users, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PapersPage() {
  const [papers, setPapers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/papers?page=${page}&search=${search}&limit=20`);
      setPapers(data.papers);
      setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPapers(); }, [page, search]);

  const deletePaper = async (id) => {
    if (!confirm('Delete this paper?')) return;
    await api.delete(`/papers/${id}`);
    fetchPapers();
  };

  const getScoreColor = (s) => s >= 70 ? 'var(--color-accent-green)' : s >= 40 ? 'var(--color-accent-amber)' : 'var(--color-accent-rose)';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Papers Collection</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{total} papers collected</p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-12 pr-4 py-3 rounded-lg text-sm outline-none focus:ring-2 glass-card"
          style={{ color: 'var(--color-text-primary)' }}
          placeholder="Search papers by title or abstract..." />
      </div>

      <div className="space-y-3">
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />) :
          papers.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-xl">
              <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>No papers yet. Start a research search!</p>
            </div>
          ) :
          papers.map((paper, i) => (
            <motion.div key={paper._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="glass-card p-5 group">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full source-${paper.source}`}>{paper.source?.replace('_', ' ')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: `${getScoreColor(paper.credibilityScore)}15`, color: getScoreColor(paper.credibilityScore) }}>
                      <Award size={11} /> {paper.credibilityScore}/100
                    </span>
                    {paper.doi && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>DOI: {paper.doi}</span>}
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{paper.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {paper.authors?.length > 0 && <span><Users size={11} className="inline mr-1" />{paper.authors.slice(0, 2).map(a => a.name).join(', ')}</span>}
                    {paper.publicationYear && <span><Calendar size={11} className="inline mr-1" />{paper.publicationYear}</span>}
                    {paper.citationCount > 0 && <span>Cited: {paper.citationCount}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {paper.url && <a href={paper.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--color-accent-blue)' }}><ExternalLink size={16} /></a>}
                  <button onClick={() => deletePaper(paper._id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: 'var(--color-accent-rose)' }}><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))
        }
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg disabled:opacity-30 hover:bg-white/5" style={{ color: 'var(--color-text-secondary)' }}>
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm px-4" style={{ color: 'var(--color-text-secondary)' }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
            className="p-2 rounded-lg disabled:opacity-30 hover:bg-white/5" style={{ color: 'var(--color-text-secondary)' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
