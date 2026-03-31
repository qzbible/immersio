import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import '@/App.css';

import MainLayout from '@/layouts/MainLayout';
import Landing from '@/pages/Landing';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import Campaign from '@/pages/Campaign';
import QuizGame from '@/pages/QuizGame';
import Premium from '@/pages/Premium';
import PremiumSuccess from '@/pages/PremiumSuccess';
import GameModes from '@/pages/GameModes';
import GamePlay from '@/pages/GamePlay';
import ModeDuo from '@/pages/ModeDuo';
import DuoPlay from '@/pages/DuoPlay';
import DuoHistory from '@/pages/DuoHistory';
import DuoLeaderboard from '@/pages/DuoLeaderboard';
import ModeGroupe from '@/pages/ModeGroupe';
import GroupHost from '@/pages/GroupHost';
import GroupPlay from '@/pages/GroupPlay';
import Leaderboard from '@/pages/Leaderboard';
import Achievements from '@/pages/Achievements';
import Tournaments from '@/pages/Tournaments';
import { SpectatorList, SpectatorView } from '@/pages/Spectator';
import Admin from '@/pages/Admin';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuthStore();
  if (loading) return null;
  return (isAuthenticated && user?.is_admin) ? children : <Navigate to="/dashboard" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppRouter() {
  const location = useLocation();
  const { setUser, setLoading, loading, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.log('Session non valide ou expirée');
      } finally {
        setLoading(false);
      }
    };
    
    if (!isAuthenticated) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/campaign" element={<ProtectedRoute><Campaign /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute><QuizGame /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><MainLayout><GameModes /></MainLayout></ProtectedRoute>} />
      <Route path="/play/:modeId" element={<ProtectedRoute><GamePlay /></ProtectedRoute>} />
      <Route path="/duo" element={<ProtectedRoute><ModeDuo /></ProtectedRoute>} />
      <Route path="/duo/play/:matchId" element={<ProtectedRoute><DuoPlay /></ProtectedRoute>} />
      <Route path="/duo/history" element={<ProtectedRoute><DuoHistory /></ProtectedRoute>} />
      <Route path="/duo/leaderboard" element={<ProtectedRoute><DuoLeaderboard /></ProtectedRoute>} />
      <Route path="/group" element={<ProtectedRoute><ModeGroupe /></ProtectedRoute>} />
      <Route path="/group/host/:sessionId" element={<ProtectedRoute><GroupHost /></ProtectedRoute>} />
      <Route path="/group/play/:sessionId" element={<ProtectedRoute><GroupPlay /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><MainLayout><Leaderboard /></MainLayout></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><MainLayout><Achievements /></MainLayout></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><MainLayout><Tournaments /></MainLayout></ProtectedRoute>} />
      <Route path="/spectate" element={<ProtectedRoute><MainLayout><SpectatorList /></MainLayout></ProtectedRoute>} />
      <Route path="/spectate/:matchId" element={<ProtectedRoute><SpectatorView /></ProtectedRoute>} />
      <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
      <Route path="/premium-success" element={<ProtectedRoute><PremiumSuccess /></ProtectedRoute>} />
      
      {/* Admin Route */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
