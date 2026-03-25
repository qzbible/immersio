import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import GamesPage from './pages/Games';
import AIPage from './pages/AI';
import Login from './pages/Login';
import Register from './pages/Register';
import JeuxPage from './pages/Jeux';
import PlayGamePage from './pages/PlayGame';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

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

  if (!user || !user.is_admin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/*" element={
          <AuthGuard>
            <div className="flex bg-admin-bg min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64 min-h-screen">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/ai-gen" element={<AIPage />} />
                  <Route path="/jeux" element={<JeuxPage />} />
                  <Route path="/play/:modeId" element={<PlayGamePage />} />
                  <Route path="/settings" element={<div className="p-8 text-white/40">Paramètres - Bientôt disponible</div>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  );
};

export default App;
