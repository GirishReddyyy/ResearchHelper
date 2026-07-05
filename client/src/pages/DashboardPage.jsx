import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Search, FileText, BookOpen, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Searches', value: stats?.totalSearches || 0, icon: Search, color: 'var(--color-accent-blue)', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Papers Collected', value: stats?.totalPapers || 0, icon: BookOpen, color: 'var(--color-accent-cyan)', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Reports Generated', value: stats?.totalReports || 0, icon: FileText, color: 'var(--color-accent-green)', bg: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Here's your research overview
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{card.label}</p>
                <p className="text-3xl font-bold mt-2" style={{ color: card.color }}>
                  {loading ? <span className="skeleton inline-block w-16 h-8 rounded" /> : card.value}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon size={24} style={{ color: card.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions + Recent Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Quick Actions</h2>
          <div className="space-y-3">
            {[
              { to: '/search', icon: Search, label: 'New Research Search', desc: 'Search across multiple academic databases', color: 'var(--color-accent-blue)' },
              { to: '/reports', icon: FileText, label: 'Create Report', desc: 'Generate publication-ready reports', color: 'var(--color-accent-green)' },
              { to: '/ai-assistant', icon: Sparkles, label: 'AI Assistant', desc: 'Generate literature reviews and summaries', color: 'var(--color-accent-purple)' },
            ].map((action) => (
              <Link key={action.to} to={action.to}>
                <div className="flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-white/5 cursor-pointer group"
                  style={{ border: '1px solid var(--color-border)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${action.color}15` }}>
                    <action.icon size={20} style={{ color: action.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{action.label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{action.desc}</p>
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Searches */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Searches</h2>
            <Link to="/search" className="text-xs font-medium" style={{ color: 'var(--color-accent-blue)' }}>View all</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))
            ) : stats?.recentSearches?.length ? (
              stats.recentSearches.map((s) => (
                <Link key={s._id} to={`/search`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/5"
                    style={{ border: '1px solid var(--color-border)' }}>
                    <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{s.topic}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {s.resultCount || 0} results • {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                      s.status === 'failed' ? 'text-red-400 bg-red-400/10' :
                      'text-amber-400 bg-amber-400/10'
                    }`}>{s.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No searches yet. Start your first research!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
