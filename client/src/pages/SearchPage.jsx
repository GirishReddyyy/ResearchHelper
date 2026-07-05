import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSearchStore from '@/store/searchStore';
import { Search, Loader2, X, ExternalLink, Award, Calendar, Users } from 'lucide-react';

const SOURCES = [
  { id: 'arxiv', label: 'arXiv', color: '#B31B1B' },
  { id: 'crossref', label: 'CrossRef', color: '#F3652B' },
  { id: 'semantic_scholar', label: 'Semantic Scholar', color: '#1857B6' },
  { id: 'google_scholar', label: 'Google Scholar', color: '#4285F4' },
  { id: 'pubmed', label: 'PubMed', color: '#326085' },
];

export default function SearchPage() {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [domain, setDomain] = useState('');
  const [sources, setSources] = useState(SOURCES.map(s => s.id));
  const { startSearch, results, loading, polling, error } = useSearchStore();

  const toggleSource = (id) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    startSearch({
      topic,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      yearRange: { start: yearStart ? parseInt(yearStart) : undefined, end: yearEnd ? parseInt(yearEnd) : undefined },
      domain,
      sources,
    });
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--color-accent-green)';
    if (score >= 40) return 'var(--color-accent-amber)';
    return 'var(--color-accent-rose)';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Research Search</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Search across multiple academic databases simultaneously
        </p>
      </div>

      {/* Search Form */}
      <motion.form onSubmit={handleSearch} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Research Topic *</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input id="search-topic" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="e.g., Machine Learning in Healthcare" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Keywords (comma-separated)</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="deep learning, neural networks" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Year From</label>
              <input type="number" value={yearStart} onChange={(e) => setYearStart(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="2020" min="1900" max="2026" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Year To</label>
              <input type="number" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="2026" min="1900" max="2026" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Domain</label>
            <input value={domain} onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="Computer Science" />
          </div>
        </div>

        {/* Source Selection */}
        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>Search Sources</label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <button key={s.id} type="button" onClick={() => toggleSource(s.id)}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sources.includes(s.id) ? `${s.color}20` : 'var(--color-bg-primary)',
                  color: sources.includes(s.id) ? s.color : 'var(--color-text-muted)',
                  border: `1px solid ${sources.includes(s.id) ? `${s.color}50` : 'var(--color-border)'}`,
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button id="search-submit" type="submit" disabled={loading || polling || !topic}
          className="w-full py-3 rounded-lg font-semibold text-white transition-all gradient-primary hover:opacity-90 disabled:opacity-50">
          {loading || polling ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {polling ? 'Searching databases...' : 'Starting search...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Search size={18} /> Search Papers</span>
          )}
        </button>
      </motion.form>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--color-accent-rose)', border: '1px solid rgba(244,63,94,0.2)' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Found {results.length} papers
          </h2>
          <div className="space-y-4">
            {results.map((paper, i) => (
              <motion.div key={paper._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="glass-card p-5 transition-all hover:border-[var(--color-border-light)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full source-${paper.source}`}>{paper.source?.replace('_', ' ')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: `${getScoreColor(paper.credibilityScore)}15`, color: getScoreColor(paper.credibilityScore), border: `1px solid ${getScoreColor(paper.credibilityScore)}30` }}>
                        <Award size={12} /> {paper.credibilityScore}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{paper.title}</h3>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {paper.authors?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Users size={12} /> {paper.authors.slice(0, 3).map(a => a.name).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ''}
                        </span>
                      )}
                      {paper.publicationYear && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Calendar size={12} /> {paper.publicationYear}
                        </span>
                      )}
                    </div>
                    {paper.abstract && (
                      <p className="text-sm mt-3 line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>{paper.abstract}</p>
                    )}
                  </div>
                  {paper.url && (
                    <a href={paper.url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-colors hover:bg-white/5 flex-shrink-0"
                      style={{ color: 'var(--color-accent-blue)' }}>
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
