import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Users, Activity, Server, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'var(--color-accent-purple)' },
    { label: 'Total Searches', value: stats.searches, icon: SearchIcon, color: 'var(--color-accent-blue)' },
    { label: 'Papers Stored', value: stats.papers, icon: Server, color: 'var(--color-accent-green)' },
    { label: 'Reports Gen.', value: stats.reports, icon: Activity, color: 'var(--color-accent-rose)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{c.label}</p>
                <p className="text-2xl font-bold mt-2" style={{ color: c.color }}>{c.value}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: `${c.color}15` }}>
                <c.icon size={20} style={{ color: c.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Name</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Email</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>{user.name}</td>
                  <td className="py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Quick helper component
function SearchIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
}
