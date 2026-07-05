import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: 'var(--color-accent-indigo)' }} />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full opacity-15 blur-[120px]" style={{ background: 'var(--color-accent-cyan)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Join the Research Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent-rose)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
            <input
              id="register-name" type="text" value={name}
              onChange={(e) => { setName(e.target.value); clearError(); }}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all focus:ring-2"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="John Doe" required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
            <input
              id="register-email" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all focus:ring-2"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="you@example.com" required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
            <div className="relative">
              <input
                id="register-password" type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all focus:ring-2 pr-12"
                style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                placeholder="Min 6 characters" required minLength={6}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--color-text-muted)' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button id="register-submit" type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all gradient-primary hover:opacity-90 disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--color-accent-blue)' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
