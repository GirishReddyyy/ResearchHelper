import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import PapersPage from './pages/PapersPage';
import AIAssistantPage from './pages/AIAssistantPage';
import CitationsPage from './pages/CitationsPage';
import ReportsPage from './pages/ReportsPage';
import FileExplorerPage from './pages/FileExplorerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
        success: { iconTheme: { primary: 'var(--color-accent-green)', secondary: 'white' } },
        error: { iconTheme: { primary: 'var(--color-accent-rose)', secondary: 'white' } },
      }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="papers" element={<PapersPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="citations" element={<CitationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="files" element={<FileExplorerPage />} />
          
          <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
