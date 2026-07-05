import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Folder, File, ChevronRight, FolderPlus, MoreVertical, Search, FileText } from 'lucide-react';

export default function FileExplorerPage() {
  const [folders, setFolders] = useState([]);
  const [reports, setReports] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/files').then(({ data }) => {
      setFolders(data.folders);
      setReports(data.reports);
      setLoading(false);
    });
  }, []);

  const currentFolders = folders.filter(f => f.parentPath === currentPath);
  const currentReports = reports.filter(r => r.folder === currentPath);

  const navigateUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.length === 1 ? '/' : parts.join('/'));
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>File Explorer</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage your reports and documents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
          <FolderPlus size={16} /> New Folder
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 p-3 rounded-t-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <button onClick={() => setCurrentPath('/')} className="text-sm font-medium transition-colors hover:text-white"
          style={{ color: currentPath === '/' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Home</button>
        {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((part, i, arr) => {
          const path = '/' + arr.slice(0, i + 1).join('/');
          return (
            <div key={path} className="flex items-center gap-2">
              <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
              <button onClick={() => setCurrentPath(path)} className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: currentPath === path ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {part}
              </button>
            </div>
          );
        })}
      </div>

      {/* File List */}
      <div className="flex-1 p-4 rounded-b-xl overflow-y-auto glass-card border-t-0 rounded-t-none">
        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentPath !== '/' && (
              <div onClick={navigateUp} className="p-4 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-white/5" style={{ border: '1px solid var(--color-border)' }}>
                <Folder size={32} style={{ color: 'var(--color-accent-blue)' }} />
                <span className="text-sm font-medium truncate w-full text-center" style={{ color: 'var(--color-text-primary)' }}>..</span>
              </div>
            )}
            
            {currentFolders.map(folder => (
              <div key={folder._id} onClick={() => setCurrentPath(folder.path)} className="p-4 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-white/5 group" style={{ border: '1px solid var(--color-border)' }}>
                <Folder size={32} style={{ color: folder.color || 'var(--color-accent-blue)' }} />
                <span className="text-sm font-medium truncate w-full text-center" style={{ color: 'var(--color-text-primary)' }}>{folder.name}</span>
              </div>
            ))}

            {currentReports.map(report => (
              <div key={report._id} className="p-4 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-white/5 group relative" style={{ border: '1px solid var(--color-border)' }}>
                <FileText size={32} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-sm font-medium truncate w-full text-center" style={{ color: 'var(--color-text-primary)' }} title={report.title}>{report.title}</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>{report.status}</span>
              </div>
            ))}

            {currentFolders.length === 0 && currentReports.length === 0 && currentPath === '/' && (
              <div className="col-span-full py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Folder is empty
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
