import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { FileText, Plus, Download, Trash2, Edit2, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', topic: '' });
  const [creating, setCreating] = useState(false);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/reports?limit=50');
      setReports(data.reports);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/reports', newReport);
      setShowCreateModal(false);
      setNewReport({ title: '', topic: '' });
      fetchReports();
    } catch {} finally { setCreating(false); }
  };

  const handleGenerate = async (id) => {
    try {
      await api.post(`/reports/${id}/generate`);
      fetchReports(); // Status will update to generating
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      fetchReports();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage and generate publication-ready reports</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white gradient-primary hover:opacity-90">
          <Plus size={16} /> New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />) :
          reports.length === 0 ? (
            <div className="col-span-full glass-card p-12 text-center">
              <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>No reports created yet.</p>
            </div>
          ) :
          reports.map((report) => (
            <motion.div key={report._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-5 flex flex-col h-full group">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-lg line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{report.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    report.status === 'completed' ? 'text-green-400 bg-green-400/10 border border-green-400/20' :
                    report.status === 'generating' ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20' :
                    report.status === 'failed' ? 'text-red-400 bg-red-400/10 border border-red-400/20' :
                    'text-blue-400 bg-blue-400/10 border border-blue-400/20'
                  }`}>
                    {report.status}
                  </span>
                </div>
                {report.topic && <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>Topic: {report.topic}</p>}
                
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {report.papers?.length || 0} Papers</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
                {report.status === 'completed' ? (
                  <div className="flex gap-2">
                    {['pdf', 'docx', 'markdown'].map(fmt => (
                      <a key={fmt} href={`/api/reports/${report._id}/download/${fmt}`} target="_blank" rel="noopener noreferrer"
                        className="px-2 py-1 rounded text-xs font-medium uppercase transition-colors hover:bg-white/5"
                        style={{ color: 'var(--color-accent-blue)', border: '1px solid var(--color-border)' }}>
                        {fmt === 'markdown' ? 'md' : fmt}
                      </a>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => handleGenerate(report._id)} disabled={report.status === 'generating'}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-50"
                    style={{ color: 'var(--color-accent-green)', border: '1px solid var(--color-border)' }}>
                    {report.status === 'generating' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {report.status === 'generating' ? 'Generating...' : 'Generate'}
                  </button>
                )}
                
                <button onClick={() => handleDelete(report._id)} className="p-1.5 rounded text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        }
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Create New Report</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Report Title</label>
                <input value={newReport.title} onChange={e => setNewReport({...newReport, title: e.target.value})} required
                  className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 outline-none"
                  style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'white' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Research Topic</label>
                <input value={newReport.topic} onChange={e => setNewReport({...newReport, topic: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 outline-none"
                  style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'white' }} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg text-sm font-medium text-white gradient-primary hover:opacity-90 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
