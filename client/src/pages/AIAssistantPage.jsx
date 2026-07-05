import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Brain, Sparkles, TrendingUp, AlertTriangle, GitCompare, Loader2, BookOpen, Copy, Check } from 'lucide-react';

const ACTIONS = [
  { id: 'literature-review', label: 'Literature Review', icon: BookOpen, desc: 'Synthesize papers into a cohesive review', color: 'var(--color-accent-blue)' },
  { id: 'summary', label: 'Research Summary', icon: Sparkles, desc: 'Executive summary of the research landscape', color: 'var(--color-accent-cyan)' },
  { id: 'trends', label: 'Identify Trends', icon: TrendingUp, desc: 'Extract patterns and emerging topics', color: 'var(--color-accent-green)' },
  { id: 'gaps', label: 'Research Gaps', icon: AlertTriangle, desc: 'Find under-researched areas', color: 'var(--color-accent-amber)' },
];

export default function AIAssistantPage() {
  const [papers, setPapers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/ai/status').then(({ data }) => setAiAvailable(data.available));
    api.get('/papers?limit=50').then(({ data }) => setPapers(data.papers));
  }, []);

  const togglePaper = (id) => setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const runAction = async (action) => {
    if (selected.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post(`/ai/${action}`, { paperIds: selected });
      setResult(data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Failed to generate' });
    } finally { setLoading(false); }
  };

  const copyResult = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (aiAvailable === false) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>AI Research Assistant</h1>
        <div className="glass-card p-12 text-center">
          <Brain size={56} className="mx-auto mb-4" style={{ color: 'var(--color-accent-purple)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>AI Features Not Configured</h2>
          <p className="max-w-md mx-auto mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Add your <code className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--color-bg-card)', color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>OPENAI_API_KEY</code> to the server's <code className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--color-bg-card)', color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>.env</code> file to enable AI features.
          </p>
          <div className="p-4 rounded-lg text-left text-sm max-w-sm mx-auto" style={{ background: 'var(--color-bg-primary)', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-green)' }}>
            OPENAI_API_KEY=sk-your-key-here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>AI Research Assistant</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paper selector */}
        <div className="glass-card p-5 lg:col-span-1 max-h-[70vh] overflow-y-auto">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Select Papers ({selected.length} selected)
          </h2>
          <div className="space-y-2">
            {papers.map((p) => (
              <label key={p._id} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5"
                style={{ border: `1px solid ${selected.includes(p._id) ? 'var(--color-accent-blue)' : 'var(--color-border)'}`, background: selected.includes(p._id) ? 'rgba(59,130,246,0.05)' : undefined }}>
                <input type="checkbox" checked={selected.includes(p._id)} onChange={() => togglePaper(p._id)}
                  className="mt-1 accent-blue-500" />
                <div>
                  <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{p.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{p.publicationYear} • {p.source?.replace('_', ' ')}</p>
                </div>
              </label>
            ))}
            {papers.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No papers. Search first!</p>}
          </div>
        </div>

        {/* Actions + Results */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a) => (
              <button key={a.id} onClick={() => runAction(a.id)} disabled={loading || selected.length === 0}
                className="glass-card p-4 text-left transition-all hover:border-[var(--color-border-light)] disabled:opacity-40 disabled:cursor-not-allowed">
                <a.icon size={22} style={{ color: a.color }} />
                <p className="text-sm font-semibold mt-2" style={{ color: 'var(--color-text-primary)' }}>{a.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{a.desc}</p>
              </button>
            ))}
          </div>

          {/* Result */}
          {loading && (
            <div className="glass-card p-12 text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: 'var(--color-accent-blue)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>Generating with AI...</p>
            </div>
          )}

          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-accent-cyan)' }}>AI Generated Result</h3>
                <button onClick={copyResult} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5"
                  style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
              {result.error ? (
                <p style={{ color: 'var(--color-accent-rose)' }}>{result.error}</p>
              ) : result.available === false ? (
                <p style={{ color: 'var(--color-accent-amber)' }}>{result.message}</p>
              ) : (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--color-text-secondary)' }}>
                  {result.content}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
