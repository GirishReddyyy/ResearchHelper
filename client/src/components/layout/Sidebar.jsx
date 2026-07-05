import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/store/authStore';
import {
  Search, FileText, BookOpen, Brain, Quote, LayoutDashboard,
  FolderOpen, Settings, Shield, ChevronLeft, ChevronRight,
  LogOut, Menu, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/search', icon: Search, label: 'Research Search' },
  { path: '/papers', icon: BookOpen, label: 'Papers' },
  { path: '/ai-assistant', icon: Brain, label: 'AI Assistant' },
  { path: '/citations', icon: Quote, label: 'Citations' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/files', icon: FolderOpen, label: 'File Explorer' },
];

const adminItems = [
  { path: '/admin', icon: Shield, label: 'Admin Panel' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">ResearchIQ</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer relative ${
                    isActive
                      ? 'text-white'
                      : 'hover:bg-white/5'
                  }`}
                  style={{
                    color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                    background: isActive ? 'rgba(59, 130, 246, 0.1)' : undefined,
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                      style={{ background: 'var(--color-accent-blue)' }}
                    />
                  )}
                  <item.icon size={20} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Admin
              </p>
            )}
            {adminItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer`}
                    style={{
                      color: isActive ? 'var(--color-accent-purple)' : 'var(--color-text-secondary)',
                      background: isActive ? 'rgba(139, 92, 246, 0.1)' : undefined,
                    }}
                  >
                    <item.icon size={20} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ background: 'var(--color-accent-indigo)', color: 'white' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-accent-rose)' }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
