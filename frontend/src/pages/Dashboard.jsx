import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import {
  LogOut, Shield, GraduationCap, Swords, Users, Trophy, Zap,
  Flame, Heart, Coins, Crown, ArrowRight, Star, TrendingUp, BookOpen, Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const S = { fontFamily: 'Inter, sans-serif' };

/* ── Stat pill ───────────────────────────────────────────────── */
const StatPill = ({ icon: Icon, value, color }) => (
  <div
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
    style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
  >
    <Icon size={14} />{value}
  </div>
);

/* ── Arena card ──────────────────────────────────────────────── */
const ArenaCard = ({ icon, label, color, to, navigate }) => (
  <button
    onClick={() => navigate(to)}
    className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl transition-all"
    style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}12`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bq-border)'; e.currentTarget.style.background = 'var(--bq-bg-card)'; e.currentTarget.style.transform = 'none'; }}
  >
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${color}20` }}>{icon}</div>
    <span className="text-xs font-semibold" style={{ color: 'var(--bq-text-dim)' }}>{label}</span>
  </button>
);

/* ════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const [certs, setCerts]           = useState([]);
  const [history, setHistory]       = useState([]);
  const [dailyStatus, setDailyStatus] = useState({ streak: 0 });
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [userRes, dailyRes, certsRes, historyRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/daily-manna/status`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/certifications`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/exams/history`, { withCredentials: true }),
      ]);
      setUser(userRes.data);
      setDailyStatus(dailyRes.data);
      setCerts(certsRes.data || []);
      setHistory(historyRes.data || []);
    } catch (e) {
      if (e.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      clearUser(); navigate('/');
    } catch (e) { console.error(e); }
  };

  const xpForNext  = user ? user.level * 100 : 100;
  const xpProgress = user ? Math.min((user.xp / xpForNext) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bq-bg)' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2.5px solid rgba(249,115,22,0.2)', borderTopColor: '#f97316' }} />
      </div>
    );
  }

  const featured = (certs || []).slice(0, 4);

  return (
    <div className="min-h-screen pb-28 max-w-5xl mx-auto" style={S}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-4"
        style={{ background: 'rgba(13,14,20,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bq-border)' }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="CertifPratice Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
          <span className="text-lg font-bold hidden sm:block" style={{ color: 'var(--bq-text)', fontFamily: 'Space Grotesk, sans-serif' }}>
            Certif<span style={{ color: '#f97316' }}>Pratice</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <StatPill icon={Heart}  value={user.lives}          color="#ef4444" />
              <StatPill icon={Coins}  value={user.coins}          color="#eab308" />
              <StatPill icon={Flame}  value={dailyStatus.streak}  color="#f97316" />
            </>
          )}
          {user?.is_admin && (
            <button onClick={() => navigate('/admin')}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: 'var(--bq-bg-elevated)', border: '1px solid var(--bq-border)', color: '#3b82f6' }}>
              <Shield size={16} />
            </button>
          )}
          <button onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--bq-bg-elevated)', border: '1px solid var(--bq-border)', color: 'var(--bq-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--bq-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--bq-text-muted)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-8">

        {/* ── Profile bar ─────────────────────────────────────── */}
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}>
          <div className="relative flex-shrink-0">
            <img
              src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=2563eb&color=fff`}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover"
            />
            {user?.is_premium && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#eab308' }}>
                <Crown size={12} color="white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold truncate" style={{ color: 'var(--bq-text)', fontFamily: 'Space Grotesk, sans-serif' }}>
                {user?.name}
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(37,99,235,0.15)', color: '#3b82f6' }}>
                Niv. {user?.level}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full mb-1" style={{ background: 'var(--bq-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg,#2563eb,#f97316)' }} />
            </div>
            <p className="text-xs" style={{ color: 'var(--bq-text-muted)' }}>{user?.xp} / {xpForNext} XP</p>
          </div>
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--bq-bg-elevated)', border: '1px solid var(--bq-border)', color: 'var(--bq-text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bq-border-hover)'; e.currentTarget.style.color = 'var(--bq-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bq-border)'; e.currentTarget.style.color = 'var(--bq-text-dim)'; }}
          >
            <TrendingUp size={13} /> Classement
          </button>
        </div>

        {/* ── Certifications Featured ──────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: 'var(--bq-text)', fontFamily: 'Space Grotesk, sans-serif' }}>
              Passer une certification
            </h3>
            <button onClick={() => navigate('/certifications')} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#f97316' }}>
              Toutes <ArrowRight size={13} />
            </button>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {featured.map(cert => (
                <button
                  key={cert.mode_id}
                  onClick={() => navigate(`/exam/${cert.mode_id}`)}
                  className="p-4 rounded-xl text-left flex flex-col gap-2 transition-all"
                  style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bq-border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span className="text-2xl">{cert.icon || '📋'}</span>
                  <span className="text-xs font-bold leading-tight" style={{ color: 'var(--bq-text)' }}>{cert.name}</span>
                  {cert.duration_minutes && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--bq-text-muted)' }}>
                      <Clock size={10} /> {cert.duration_minutes} min
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate('/certifications')}
              className="w-full py-8 rounded-xl flex flex-col items-center gap-3"
              style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bq-border)'}
            >
              <GraduationCap size={32} style={{ color: 'var(--bq-text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--bq-text)' }}>Parcourir les certifications</span>
            </button>
          )}
        </div>

        {/* ── Mode Compétition ────────────────────────────────── */}
        <div>
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--bq-text)', fontFamily: 'Space Grotesk, sans-serif' }}>
            Mode Compétition
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ArenaCard navigate={navigate} to="/duo"         label="Duel"        icon="⚔️"  color="#ef4444" />
            <ArenaCard navigate={navigate} to="/group"       label="Groupe"      icon="👥"  color="#3b82f6" />
            <ArenaCard navigate={navigate} to="/tournaments" label="Tournois"    icon="🏆"  color="#eab308" />
            <ArenaCard navigate={navigate} to="/spectate"    label="En direct"   icon="📡"  color="#f97316" />
          </div>
        </div>

        {/* ── Mes Évaluations ──────────────────────────────────── */}
        <div>
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--bq-text)', fontFamily: 'Space Grotesk, sans-serif' }}>
            Mes Évaluations
          </h3>
          <div className="space-y-3">
            {history.length > 0 ? (
              history.map(session => (
                <div 
                  key={session.session_id}
                  className="p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                  style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold border ${session.score_pct >= 70 ? 'bg-[#00c48c]/10 border-[#00c48c]/30 text-[#00c48c]' : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/30 text-[#ff4d4d]'}`}>
                      {session.score_pct}%
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--bq-text)' }}>{session.cert_name}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--bq-text-muted)' }}>
                        {new Date(session.completed_at).toLocaleDateString()} • {session.correct}/{session.total} pts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.score_pct >= 70 && (
                      <span className="px-2 py-1 rounded bg-[#00c48c] text-[9px] font-black uppercase text-white shadow-[0_0_15px_rgba(0,196,140,0.4)]">
                        Validé
                      </span>
                    )}
                    <button 
                      onClick={() => navigate(`/exam/${session.mode_id}?review=${session.session_id}`)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 bg-white/5 text-white/40 hover:text-white transition-all"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-white/10" style={{ background: 'var(--bq-bg-card)' }}>
                <BookOpen size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs text-white/30 font-medium">Vous n'avez pas encore passé d'évaluation.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Raccourcis ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/achievements')}
            className="p-4 rounded-xl flex items-center gap-3 text-left"
            style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#a855f7'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bq-border)'}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
              <Star size={18} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--bq-text)' }}>Badges</p>
              <p className="text-xs" style={{ color: 'var(--bq-text-muted)' }}>Récompenses</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/premium')}
            className="p-4 rounded-xl flex items-center gap-3 text-left"
            style={{ background: 'var(--bq-bg-card)', border: '1px solid var(--bq-border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#eab308'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bq-border)'}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,179,8,0.15)' }}>
              <Crown size={18} style={{ color: '#eab308' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--bq-text)' }}>Premium</p>
              <p className="text-xs" style={{ color: 'var(--bq-text-muted)' }}>{user?.is_premium ? 'Actif ✓' : 'Débloquer'}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
