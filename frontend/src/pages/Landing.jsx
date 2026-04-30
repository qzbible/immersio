import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { ArrowRight, Mail, CheckCircle, TrendingUp, GraduationCap, Star, Search, Shield, Layers, BookOpen, Award, Zap, ExternalLink, ChevronRight } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Footer from '@/components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FloatingCard = ({ children, className = '', style = {} }) => (
  <div
    className={`absolute hidden md:flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl ${className}`}
    style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', zIndex: 10, ...style }}
  >
    {children}
  </div>
);

import badge1 from '../assets/badges/badge1.png';
import badge2 from '../assets/badges/badge2.png';
import badge3 from '../assets/badges/badge3.png';
import badge4 from '../assets/badges/badge4.png';
import badge5 from '../assets/badges/badge5.png';
import trainingIllustration from '../assets/illustrations/training-insight.png';

const LOGO_DATA = [
  { name: 'badge1', src: badge1 },
  { name: 'badge2', src: badge2 },
  { name: 'badge3', src: badge3 },
  { name: 'badge4', src: badge4 },
  { name: 'badge5', src: badge5 },
];

const TechCarousel3D = ({ children }) => (
  <div className="relative z-30 w-full min-h-[450px] flex items-center justify-center my-10 overflow-visible" style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}>
    
    {/* Text Layer (Static at Z=0) */}
    <div className="relative z-20 flex flex-col items-center text-center pointer-events-auto" style={{ transform: 'translateZ(10px)' }}>
      {children}
    </div>

    {/* 3D Rotating Ring Layer - Tilted for Saturn-like feel */}
    <div 
      className="absolute inset-0 pointer-events-none flex items-center justify-center" 
      style={{ 
        transformStyle: 'preserve-3d', 
        animation: 'carousel3d 40s infinite linear'
      }}
    >
      {LOGO_DATA.map((logo, i) => (
        <div 
          key={logo.name}
          className="absolute flex items-center justify-center rounded-[2rem] group transition-all duration-300 w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderBottom: '3px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            /* Normalized radius */
            transform: `rotateY(${i * 72}deg) translateZ(650px)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Enhanced Counter-rotation for stability */}
          <div 
            style={{ 
              transformStyle: 'preserve-3d',
              animation: 'counterCarousel3d 40s infinite linear'
            }} 
            className="flex items-center justify-center w-full h-full"
          >
            <div 
              style={{ 
                transform: `rotateX(20deg) rotateY(${-i * 72}deg)`,
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src={logo.src} 
                alt={logo.name} 
                className="relative w-[75px] h-[75px] sm:w-[95px] sm:h-[95px] object-contain filter drop-shadow-[0_15px_25px_rgba(255,255,255,0.3)]" 
              />
            </div>
          </div>
        </div>
      ))}
    </div>

    <style>{`
      @keyframes carousel3d {
        from { transform: rotateX(-20deg) rotateY(0deg); }
        to { transform: rotateX(-20deg) rotateY(-360deg); }
      }
      @keyframes counterCarousel3d {
        from { transform: rotateY(0deg); }
        to { transform: rotateY(360deg); }
      }
    `}</style>
  </div>
);

/* ── Domain chip ──────────────────────────────────────────────── */
const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
    style={active
      ? { background: '#1a1d2e', color: 'white' }
      : { background: 'transparent', color: '#6b7280', border: '1.5px solid #e5e7eb' }
    }
  >
    {label}
  </button>
);

/* ── Certification Elite Card ──────────────────────────────────── */
const CertCard = ({ cert, onClick }) => (
  <div
    onClick={() => onClick(cert)}
    className="group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300 h-full text-left"
    style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#f97316';
      e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(249,115,22,0.2)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'none';
    }}
  >
    <div className="p-5 flex flex-col gap-4 flex-1">
      <div className="flex items-center gap-2">
        {cert.is_official && (
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter" style={{ background: '#f97316', color: 'white' }}>
            ✨ RECOMMANDÉ
          </span>
        )}
        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-white/5 text-white/40">
          {cert.domain || cert.category || 'Certification'}
        </span>
      </div>
      
      <div className="space-y-2 mb-auto">
        <h3 className="text-base font-bold leading-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {cert.name}
        </h3>
        <p className="text-[11px] leading-relaxed line-clamp-2 text-white/40">
          {cert.description || "Évaluez et validez vos compétences techniques avec notre examen complet."}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white">
          Objectif :
        </p>
        <p className="text-[11px] leading-snug text-white/40 line-clamp-2">
          {cert.objectives || "Maîtrise des concepts clés, pratique et certification."}
        </p>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle size={12} className="text-[#f97316]" /> {cert.question_count || '100'} questions
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Layers size={12} className="text-[#f97316]" /> {cert.theme_count || '12'} thèmes
        </span>
      </div>

      <button className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wide bg-[#f97316] text-white">
        Commencer
      </button>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
const Landing = () => {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuthStore();
  const [showEmail, setShowEmail] = useState(false);
  const [step, setStep]           = useState(1);
  const [formData, setFormData]   = useState({ email: '', name: '', church: '' });
  const [otpCode, setOtpCode]     = useState('');
  const [loading, setLoading]     = useState(false);
  
  const [activeDomain, setActiveDomain] = useState('Tous');
  const [search, setSearch]       = useState('');
  const [certs, setCerts]         = useState([]);
  const [domains, setDomains]     = useState(['Tous']);

  // Fetch real certifications
  useEffect(() => { 
    Promise.all([
      axios.get(`${BACKEND_URL}/api/certifications`),
      axios.get(`${BACKEND_URL}/api/certifications/domains`)
    ]).then(([certsRes, domainsRes]) => {
      const published = certsRes.data || [];
      const normalized = published.map(e => ({
        mode_id:        e.cert_id || e.mode_id,
        name:           e.name,
        description:    e.description || '',
        category:       e.domain || 'Certification',
        domain:         e.domain || 'Certification',
        question_count: e.question_count || 0,
        theme_count:    e.theme_count || 0,
        is_official:    true,
        available:      true,
      }));
      setCerts(normalized);
      
      const d = domainsRes.data?.map(d => d.name) || [];
      setDomains(['Tous', ...d]);
    }).catch(e => console.error("Failed to fetch certs for landing", e));
  }, [isAuthenticated, navigate]);

  const filtered = certs.filter(c =>
    (activeDomain === 'Tous' || c.domain === activeDomain || c.category === activeDomain) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleLogin = () => {
    if (isAuthenticated) {
      navigate('/certifications');
    } else {
      const redirect = window.location.origin + '/certifications';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
    }
  };

  const handleCardClick = (cert) => {
    if (isAuthenticated) {
      navigate('/certifications');
    } else {
      handleLogin();
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await axios.post(`${BACKEND_URL}/api/auth/otp/request`, formData); setStep(2); }
    catch (err) { alert(err.response?.data?.detail || "Erreur d'envoi du code"); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/otp/verify`, { email: formData.email, code: otpCode }, { withCredentials: true });
      setUser(res.data); navigate('/certifications');
    } catch { alert('Code invalide ou expiré'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ══ SECTION 1 : Hero ═══════════════════════════════════ */}
      <div className="relative overflow-hidden min-h-[75vh] flex flex-col" style={{ background: '#0f0d1a' }}>

        {/* Color orbs */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position:'absolute', top:'5%',   left:'3%',   width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',    filter:'blur(50px)' }} />
          <div style={{ position:'absolute', top:'15%',  right:'5%',  width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,60,220,0.4) 0%, transparent 70%)',   filter:'blur(40px)' }} />
          <div style={{ position:'absolute', bottom:'10%', left:'30%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(230,120,0,0.3) 0%, transparent 70%)',    filter:'blur(50px)' }} />
          <div style={{ position:'absolute', bottom:'5%',  right:'10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(220,50,150,0.35) 0%, transparent 70%)',  filter:'blur(35px)' }} />
          <div style={{ position:'absolute', top:'40%',  left:'15%',  width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,196,140,0.25) 0%, transparent 70%)',  filter:'blur(30px)' }} />
        </div>

        {/* Global Header is now provided by MainLayout */}

        {/* Hero */}
        <TechCarousel3D>
          {/* Badge */}
          <div
            className="relative z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
          >
            <CheckCircle size={14} style={{ color: '#00c48c' }} />
            Choisi par 50 000+ professionnels en reconversion
          </div>

          {/* Title */}
          <h1 className="relative z-10 text-5xl sm:text-6xl lg:text-7xl font-black mb-4 leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span style={{ color: 'white' }}>Préparez vos</span>
            <br />
            <span style={{ color: '#f97316' }}>Certifications</span>
          </h1>

          <p className="text-lg sm:text-xl mb-10 max-w-xl" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Pratiquez avec de vraies questions d'examen. Obtenez un feedback instantané.
            Rejoignez les professionnels qui ont réussi du premier coup.
          </p>

          {/* CTAs */}
          {!showEmail ? (
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-base"
                style={{ background: '#f97316', color: 'white' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fb923c'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.transform = 'none'; }}
              >
                Commencer gratuitement <ArrowRight size={18} />
              </button>
              <button
                onClick={() => { const el = document.getElementById('catalogue'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-7 py-3.5 rounded-full font-semibold text-base"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                Voir le catalogue
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md rounded-2xl p-6 text-left"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}>
              <h3 className="text-white font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Connexion par Email
              </h3>
              {step === 1 ? (
                <form onSubmit={handleRequestOTP} className="space-y-3">
                  {[
                    { placeholder: 'Votre Nom',    key: 'name' },
                    { placeholder: 'Votre Email',  key: 'email', type: 'email' },
                    { placeholder: 'Organisation', key: 'church' },
                  ].map(f => (
                    <input key={f.key} type={f.type || 'text'} placeholder={f.placeholder}
                      value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                      required={f.key !== 'church'}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
                  ))}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: '#f97316', color: 'white', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Envoi…' : 'Recevoir le code'} <ArrowRight size={15} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-3">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Code envoyé à {formData.email}</p>
                  <input placeholder="Code à 6 chiffres" value={otpCode} onChange={e => setOtpCode(e.target.value)}
                    maxLength={6} required
                    className="w-full px-4 py-3 rounded-xl text-center text-2xl tracking-[0.4em] font-bold outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm"
                    style={{ background: '#f97316', color: 'white', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Vérification…' : 'Entrer'}
                  </button>
                </form>
              )}
              <button onClick={() => { setShowEmail(false); setStep(1); }} className="mt-3 text-xs underline" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Retour
              </button>
            </div>
          )}

          {/* Stats moved up to replace cards */}
          <div className="flex flex-wrap items-center justify-center gap-10 mt-12 py-8 rounded-[32px] bg-white/[0.02] border border-white/5 backdrop-blur-sm px-10">
            {[
              { value: '94%',   label: 'TAUX DE RÉUSSITE' },
              { value: '200K+', label: 'QUESTIONS' },
              { value: '4.9★',  label: 'NOTE' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>{s.value}</p>
                <p className="text-[10px] tracking-widest mt-1 text-white/30 font-black">{s.label}</p>
              </div>
            ))}
          </div>
        </TechCarousel3D>
      </div>

      {/* ══ SECTION 2 : Catalogue ══════════════════════════════ */}
      <div id="catalogue" style={{ background: '#f9fafb' }} className="px-4 md:px-12 py-14">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black mb-1" style={{ color: '#111827', fontFamily: 'Space Grotesk, sans-serif' }}>
            Choisissez Votre Certification
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
            Pratiquez avec 70+ certifications et plus de 200 000 questions — réussisez du premier coup
          </p>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <input
              placeholder="Trouver une certification…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'white', border: '1.5px solid #e5e7eb', color: '#111827' }}
            />
          </div>

          {/* Domain chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {domains.map(d => <Chip key={d} label={d} active={activeDomain === d} onClick={() => setActiveDomain(d)} />)}
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map(c => <CertCard key={c.mode_id} cert={c} onClick={handleCardClick} />)}
          </div>

          {/* CTA */}
          <div className="text-center mt-10 mb-20">
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all duration-300"
              style={{ background: '#f97316', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fb923c'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.transform = 'none'; }}
            >
              Accéder à toutes les certifications <ArrowRight size={16} />
            </button>
          </div>

          {/* Training Insight Block */}
          <div 
            className="group relative overflow-hidden rounded-[3rem] p-8 md:p-14"
            style={{ 
              background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Image Side */}
              <div className="w-full lg:w-[45%] order-2 lg:order-1">
                <div className="relative group">
                  {/* Decorative frame */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500/20 to-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <img 
                      src={trainingIllustration} 
                      alt="Expert Training Illustration" 
                      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/40 via-transparent to-transparent" />
                  </div>
                </div>
              </div>

              {/* Text Side */}
              <div className="w-full lg:w-[55%] order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-orange-500/10 border border-orange-500/20">
                  <Star size={14} className="text-orange-500" fill="currentColor" />
                  <span className="text-[10px] tracking-[0.2em] font-black uppercase text-orange-500">Expert Insight</span>
                </div>
                
                <h3 
                  className="text-3xl md:text-4xl font-black text-white mb-6 leading-[1.2]"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  L'Art de <span className="text-orange-500">l'Entraînement</span> Stratégique
                </h3>
                
                <div className="space-y-6 text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <p>
                    S'entraîner régulièrement permet <strong className="text-white">d'identifier vos lacunes</strong> avant le jour J. 
                    Chaque question est accompagnée d'une explication détaillée pour transformer chaque erreur en une opportunité d'apprentissage.
                  </p>
                  <p>
                    La <strong className="text-white">répétition espacée</strong> et la variation des questions ancrent les concepts 
                    dans votre mémoire à long terme, garantissant ainsi votre succès lors des examens officiels.
                  </p>
                </div>

                <div className="mt-10 flex flex-wrap gap-6 border-t border-white/5 pt-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <GraduationCap size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pédagogie</p>
                      <p className="text-sm font-bold text-white">Méthode Optimisée</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                      <TrendingUp size={18} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Performance</p>
                      <p className="text-sm font-bold text-white">Progression Flash</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Articles Block */}
          <div className="mt-12 grid lg:grid-cols-2 gap-6">
            {/* Left Col: Tips */}
            <div 
              className="rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl"
              style={{ background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(20px)' }}
            >
              <h3 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <Award size={20} className="text-orange-500" />
                </div>
                Top 10 : Conseils d'Experts
              </h3>
              
              <ul className="space-y-4">
                {[
                  "Analysez le guide officiel de la certification.",
                  "Pratiquez avec nos examens blancs chronométrés.",
                  "Étudiez les explications pour chaque erreur.",
                  "Maîtrisez la gestion du temps (Time Management).",
                  "Familiarisez-vous avec l'interface de l'examen.",
                  "Maintenez une routine d'étude régulière et courte.",
                  "Valorisez vos badges sur LinkedIn et votre CV.",
                  "Préparez des exemples concrets pour vos entretiens.",
                  "Cultivez une posture de 'Life-long Learner'.",
                  "Restez serein : la préparation est la clé du calme."
                ].map((tip, idx) => (
                  <li key={idx} className="flex gap-4 items-start group">
                    <span className="text-orange-500/30 font-black text-base leading-none mt-1 group-hover:text-orange-500 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-white/60 text-xs md:text-sm leading-snug group-hover:text-white transition-colors">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Col: Articles */}
            <div 
              className="rounded-3xl p-6 md:p-10 border border-white/5"
              style={{ background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(20px)' }}
            >
              <h3 className="text-xl md:text-2xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <BookOpen size={20} className="text-blue-500" />
                </div>
                Articles Recommandés
              </h3>
              
              <div className="space-y-3">
                {[
                  "Comment briller lors d'un entretien technique",
                  "Les 5 questions les plus fréquentes sur Kubernetes",
                  "L'art du suivi : après l'entretien, l'email parfait",
                  "Gérer le stress le jour J de votre certification",
                  "Les erreurs fatales à éviter lors de l'examen"
                ].map((article, idx) => (
                  <a 
                    key={idx} 
                    href="#" 
                    onClick={e => e.preventDefault()}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                      <span className="text-white/70 text-xs md:text-sm font-bold group-hover:text-white transition-colors">{article}</span>
                    </div>
                    <ExternalLink size={12} className="text-white/20 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button 
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#3b82f6] hover:text-white transition-colors group"
                >
                  Voir plus d'articles <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Premium / Go Premium Block */}
          <div className="mt-12">
            <div 
              className="relative overflow-hidden rounded-[3rem] p-8 md:p-14 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]"
              style={{ background: '#111827' }}
            >
              {/* Neon Glow */}
              <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-green-500/10 blur-[150px] rounded-full" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="md:w-2/3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-green-500/10 border border-green-500/20">
                    <Zap size={12} className="text-green-500" fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Offre Exceptionnelle</span>
                  </div>
                  
                  <h3 className="text-3xl md:text-5xl font-black text-white mb-4">Passez en <span className="text-green-500">Premium</span></h3>
                  <p className="text-lg text-white/40 mb-8 font-medium">Pack de Préparation aux Certifications</p>
                  
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      "Practice questions de niveau supérieur",
                      "Maîtrise accélérée : sujets critiques",
                      "Garantie satisfaction 100% (Succès ou Remboursé)",
                      "Bonus : Accès complet à tous les cours",
                      "Sans risque : Essai gratuit de 7 jours"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 mt-0.5">
                          <CheckCircle size={10} className="text-green-500" />
                        </div>
                        <span className="text-white/70 text-sm leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:w-1/3 flex flex-col items-center">
                  <button 
                    onClick={handleLogin}
                    className="w-full py-5 px-8 rounded-2xl bg-[#00ff88] text-[#0d0e14] font-black text-lg shadow-[0_10px_30px_-5px_rgba(0,255,136,0.5)] hover:shadow-[0_20px_40px_-5px_rgba(0,255,136,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    Démarrer mon essai <ArrowRight size={20} />
                  </button>
                  <p className="mt-4 text-white/30 text-xs font-medium">Aucune carte de crédit requise pour commencer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Landing;
