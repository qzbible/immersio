import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Heart, Coins, Crown, Zap, LogOut, Shield, Play, Sparkles, Flame, Tv, Gamepad2, Users, Medal, Building2, ExternalLink } from 'lucide-react';
import DailyMannaModal from '@/components/DailyMannaModal';
import ChurchModal from '@/components/ChurchModal';
import OrbitalAvatar from '@/components/OrbitalAvatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, setUser, clearUser } = useAuthStore();
  const [badges, setBadges] = useState([]);
  const [gameModes, setGameModes] = useState([]);
  const [dailyMannaStatus, setDailyMannaStatus] = useState({ can_play: false, streak: 0 });
  const [showDailyManna, setShowDailyManna] = useState(false);
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userOrgs, setUserOrgs] = useState([]);

  useEffect(() => { 
    fetchUserData(); 
    checkPayment();
  }, []);

  const checkPayment = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      try {
        await axios.post(`${BACKEND_URL}/api/verify-payment`, { session_id: sessionId }, { withCredentials: true });
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Refresh data
        fetchUserData();
      } catch (error) {
        console.error("Payment verification failed", error);
      }
    }
  };

  const fetchUserData = async () => {
    try {
      const [userRes, badgesRes, dailyRes, modesRes, orgsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/badges`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/daily-manna/status`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/game-modes`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/orgs/`, { withCredentials: true })
      ]);
      setUser(userRes.data);
      setBadges(badgesRes.data);
      setDailyMannaStatus(dailyRes.data);
      setGameModes(modesRes.data || []);
      setUserOrgs(orgsRes.data || []);
      if (dailyRes.data.can_play) setTimeout(() => setShowDailyManna(true), 1000);
    } catch (error) {
      if (error.response?.status === 401) navigate('/');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user && !user.church && !loading) {
      const hasSkipped = sessionStorage.getItem('skippedChurchModal');
      if (!hasSkipped) {
        setShowChurchModal(true);
      }
    }
  }, [user, loading]);

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      clearUser();
      navigate('/');
    } catch (error) { console.error(error); }
  };

  const xpForNextLevel = user ? user.level * 100 : 100;
  const xpProgress = user ? (user.xp / xpForNextLevel) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  // Define modes and prevent duplication
  const spotlightMode = gameModes.length > 0 ? gameModes[0] : null;
  const carouselModes = gameModes.length > 1 ? gameModes.slice(1) : [];

  return (
    <div className="min-h-screen pb-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex justify-between items-center p-4 md:px-8 lg:py-6">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500" style={{ fontFamily: 'Fraunces, serif' }}>
          BibleQuest
        </motion.h1>
        <div className="flex items-center gap-2 lg:gap-4">
          <LanguageSwitcher />
          {user?.is_admin && (
            <Button onClick={() => navigate('/admin')} variant="ghost" size="icon" className="text-yellow-400 hover:bg-yellow-400/20">
              <Shield className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>
          )}
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10 hidden sm:flex">
            <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8 px-4 md:px-8">
        
        {/* LEFT COLUMN: Profile & Quick Options (Desktop) / TOP SECTION (Mobile) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8 mb-8 lg:mb-0">
          
          {/* Hero Section (Avatar & Stats) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
            {/* ... (avatar and xp code) ... */}
            <div className="flex flex-col items-center justify-center text-center">
              <OrbitalAvatar user={user} badges={badges} size={110} />
              <h2 className="text-2xl font-bold text-white mt-6 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {user?.name}
                {user?.is_premium && <Crown className="inline w-5 h-5 text-yellow-400 ml-2 -mt-1" />}
              </h2>
              <div className="w-full mt-3">
                <div className="flex justify-between text-xs text-blue-200 mb-1 font-medium tracking-wide pb-1">
                  <span>XP {user?.xp} / {xpForNextLevel}</span>
                  <span className="text-yellow-400">Niv {user?.level + 1} ➔</span>
                </div>
                <Progress value={xpProgress} className="h-2 bg-blue-950/50" />
              </div>

              {/* Organization Status */}
              <div className="w-full mt-6 pt-6 border-t border-white/5">
                {userOrgs.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                         <Building2 size={12} className="text-blue-400" /> Mon Organisation
                       </span>
                       <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">ACTIF</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                       <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center font-bold">
                         {userOrgs[0].name.charAt(0)}
                       </div>
                       <div className="flex-1 text-left">
                          <p className="text-sm font-bold text-white leading-tight truncate">{userOrgs[0].name}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-tighter">Plan {userOrgs[0].plan || 'Gratuit'}</p>
                       </div>
                       <a 
                         href="http://localhost:5173" 
                         className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all shadow-xl"
                         title="Gérer l'organisation"
                       >
                         <ExternalLink size={16} />
                       </a>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => navigate('/premium')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-white/10 cursor-pointer group hover:border-blue-500/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Lancez votre Eglise</span>
                    </div>
                    <p className="text-xs text-white/80 leading-snug">Créez votre propre espace personnalisé sur BibleQuest.</p>
                  </div>
                )}
              </div>

              {/* Quick Stats row */}
              <div className="flex w-full items-center justify-between mt-6 bg-black/20 px-4 py-3 rounded-2xl border border-white/5">
                 {/* ... */}
                <div className="flex flex-col items-center">
                  <Heart className="w-5 h-5 text-red-500 mb-1" />
                  <span className="text-lg font-bold">{user?.lives}</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <Coins className="w-5 h-5 text-yellow-500 mb-1" />
                  <span className="text-lg font-bold">{user?.coins}</span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <Flame className="w-5 h-5 text-orange-500 mb-1" />
                  <span className="text-lg font-bold">{dailyMannaStatus.streak}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social / Multiplayer (Arena) */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" /> Arène Multijoueur
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => navigate('/duo')} className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors group flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-xl">&#x2694;&#xFE0F;</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Duel</h4>
              </div>
              
              <div onClick={() => navigate('/group')} className="bg-gradient-to-br from-teal-900/40 to-emerald-900/40 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors group flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-teal-500 to-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-xl">&#x1F465;</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Groupe</h4>
              </div>

              <div onClick={() => navigate('/tournaments')} className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors group flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-yellow-500 to-amber-500 w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                  <Trophy className="text-white w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Tournois</h4>
              </div>

              <div onClick={() => navigate('/spectate')} className="bg-gradient-to-br from-rose-900/40 to-orange-900/40 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors group flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-rose-500 to-orange-500 w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform">
                  <Tv className="text-white w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Direct</h4>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Games Showcase */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Netflix-style Section: À la une */}
          {spotlightMode && (
            <div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" /> Mode à la Une
              </h3>
              <div 
                onClick={() => navigate(`/play/${spotlightMode.mode_id}`)}
                className="group relative h-48 md:h-64 lg:h-[300px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl transition-transform lg:hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${spotlightMode.color || 'from-indigo-600 to-purple-800'} opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-700`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/40 to-transparent"></div>
                
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-yellow-400 border border-yellow-400/30">
                  POPULAIRE
                </div>
                
                <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 right-4 lg:right-6">
                  <div className="text-4xl lg:text-5xl mb-2 drop-shadow-lg transform transition-transform group-hover:-translate-y-2">{spotlightMode.icon}</div>
                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Fraunces, serif' }}>{spotlightMode.name}</h4>
                  <p className="text-sm lg:text-base text-blue-100 line-clamp-2 md:w-2/3">{spotlightMode.description}</p>
                </div>
                
                {/* Play Button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                  <div className="bg-white/20 p-4 lg:p-6 rounded-full border-2 border-white backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <Play className="w-8 h-8 lg:w-10 lg:h-10 text-white translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Netflix-style Section: Tous les modes (Horizontal Carousel) */}
          {carouselModes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4 pr-2">
                <h3 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" /> Explorer
                </h3>
                <Button variant="link" className="text-blue-300 hover:text-white lg:text-sm" onClick={() => navigate('/games')}>
                  Voir tout ➔
                </Button>
              </div>
              
              {/* Horizontal Scroll Container */}
              <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 lg:pb-6">
                {carouselModes.map((mode) => (
                  <div 
                    key={mode.mode_id}
                    onClick={() => navigate(`/play/${mode.mode_id}`)}
                    className="snap-start shrink-0 w-[220px] md:w-[260px] lg:w-[280px] h-[300px] lg:h-[340px] rounded-3xl overflow-hidden cursor-pointer relative group flex flex-col justify-end shadow-xl border border-white/5 lg:hover:-translate-y-3 transition-transform duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${mode.color || 'from-blue-600 to-blue-900'} opacity-60 transition-opacity duration-500 group-hover:opacity-90`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f24] via-[#0a0f24]/50 to-transparent"></div>
                    
                    <div className="absolute top-0 left-0 w-full p-4 lg:p-5 flex justify-between items-start">
                      <span className="text-4xl drop-shadow-lg">{mode.icon}</span>
                      <span className="bg-white/10 backdrop-blur-md text-xs px-2 py-1 rounded-md border border-white/10 shadow-lg font-mono">
                        {mode.difficulty || 'Normal'}
                      </span>
                    </div>
                    
                    <div className="relative z-10 p-4 lg:p-5 transform transition-transform duration-300 group-hover:-translate-y-2">
                      <h4 className="text-xl lg:text-2xl font-black text-white leading-tight mb-2" style={{ fontFamily: 'Fraunces, serif' }}>{mode.name}</h4>
                      <p className="text-sm text-blue-100/80 line-clamp-2 mb-4">{mode.description}</p>
                      <div className="flex items-center gap-2 text-xs font-bold font-mono text-yellow-400 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4" /> JOUER
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDailyManna && <DailyMannaModal onClose={() => setShowDailyManna(false)} onComplete={fetchUserData} />}
      <ChurchModal 
        isOpen={showChurchModal} 
        onClose={() => {
          setShowChurchModal(false);
          sessionStorage.setItem('skippedChurchModal', 'true');
        }} 
      />
    </div>
  );
};

export default Dashboard;
