import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Crown, LogOut, User as UserIcon, ClipboardList } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TopHeader = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      clearUser();
      navigate('/');
    } catch (e) {
      console.error(e);
      clearUser();
      navigate('/');
    }
  };

  const handleLogin = () => {
    const redirect = window.location.origin + '/certifications';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(13,14,20,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--bq-border)',
      }}
    >
      <div className="max-w-6xl mx-auto w-full h-[56px] flex items-center justify-between px-6 md:px-8 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="CertifPratice Logo" className="h-8 md:h-10 w-auto object-contain drop-shadow-md" />
        </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Go to Premium */}
        <button
          onClick={() => navigate('/premium')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{
            background: 'rgba(234,179,8,0.15)',
            border: '1px solid rgba(234,179,8,0.3)',
            color: '#eab308',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#eab308'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.15)'; e.currentTarget.style.color = '#eab308'; }}
        >
          <Crown size={14} />
          <span className="hidden xs:inline">Premium</span>
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/evaluations')}
              className="group flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--bq-bg-elevated)', border: '1px solid var(--bq-border)', color: 'var(--bq-text)' }}
            >
              <ClipboardList size={16} className="text-[#f97316] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden md:block">Mes évaluations</span>
            </button>
            
            <div
              className="flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer transition-all"
              style={{ background: 'var(--bq-bg-elevated)', border: '1px solid var(--bq-border)' }}
              onClick={() => navigate('/profile')}
            >
              <img
                src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=f97316&color=fff`}
                alt="Profile"
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="text-xs font-semibold hidden md:block" style={{ color: 'var(--bq-text)' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--bq-text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--bq-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--bq-text-muted)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: '#f97316', color: 'white' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ea6c00'}
            onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
          >
            Se connecter
          </button>
        )}
      </div>
      </div>
    </header>
  );
};

export default TopHeader;
