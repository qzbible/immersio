import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Toaster from './components/Toaster';
import { useOrganization } from './hooks/useOrganization';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import UsersPage from './pages/Users';
import GamesPage from './pages/Games';
import AIPage from './pages/AI';
import Login from './pages/Login';
import JeuxPage from './pages/Jeux';
import PlayGamePage from './pages/PlayGame';
import OrganizationsPage from './pages/Organizations';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProfilePage from './pages/Profile';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// Global Axios Interceptor for Org-Id
axios.interceptors.request.use((config) => {
  const activeOrgId = localStorage.getItem('active_org_id');
  if (activeOrgId) {
    config.headers['X-Org-Id'] = activeOrgId;
  }
  return config;
});

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const resp = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(resp.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-admin-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const canAccess = user.is_admin || user.is_org_owner;
  
  if (!canAccess) {
     return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-admin-bg min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/*" element={
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/ai-gen" element={<AIPage />} />
              <Route path="/jeux" element={<JeuxPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/play/:modeId" element={<PlayGamePage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  );
};

export default App;
