import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, GraduationCap, ChevronDown, BookOpen, Layers, CheckCircle } from 'lucide-react';
import Footer from '@/components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/* ── Colors ────────────────────────────────────────────────── */
const THEME = {
  accent: '#f97316', // Professional Orange
  bg: '#0d0e14',
  card: '#161b22',
  border: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textMuted: '#8b949e',
};

/* ── Custom Dropdown ─────────────────────────────────────────── */
const FilterDropdown = ({ label, value, options, onChange }) => (
  <div className="relative group min-w-[140px]">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none bg-[#161b22] border border-white/10 rounded-lg px-4 py-2.5 text-xs font-semibold text-white/70 outline-none cursor-pointer group-hover:border-[#f97316]/30 transition-all font-sans"
    >
      <option value="">{label}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
  </div>
);

/* ── Certification Card ────────────────────────────────────────── */
const CertCard = ({ cert, onClick }) => {
  const isPublishedByAdmin = cert.owner_id === 'system' || cert.is_official;
  
  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: THEME.card,
        border: `1px solid ${THEME.border}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${THEME.accent}44`;
        e.currentTarget.style.boxShadow = `0 20px 40px -20px ${THEME.accent}66`;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = THEME.border;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Type Tag & Admin Badge Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#0d0e14]/80 backdrop-blur-md text-white/50 border border-white/5">
          {cert.category || cert.domain || 'Général'}
        </span>
        {isPublishedByAdmin && (
          <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#f97316]/10 backdrop-blur-md text-[#f97316] border border-[#f97316]/20">
            Certifié Admin
          </span>
        )}
      </div>

      <div className="p-6 pt-14 flex flex-col gap-5 flex-1 relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316] opacity-[0.03] blur-[60px] pointer-events-none" />

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-black leading-tight tracking-tight" style={{ color: THEME.text, fontFamily: 'Space Grotesk, sans-serif' }}>
            {cert.name}
          </h3>
          <p className="text-[12px] leading-relaxed line-clamp-3" style={{ color: THEME.textMuted }}>
            {cert.description || "Évaluez et validez vos compétences techniques avec notre examen complet."}
          </p>
        </div>

        {/* Objectif */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: THEME.text }}>
            Objectif :
          </p>
          <p className="text-[11px] leading-snug" style={{ color: THEME.textMuted }}>
            {cert.objectives || "Maîtrise des concepts clés, pratique et certification."}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-[#f97316]" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-white">{cert.question_count || 100}</span>
              <span className="text-[9px] uppercase tracking-tighter text-white/40 font-bold">questions</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#f97316]" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-white">{cert.theme_count || 12}</span>
              <span className="text-[9px] uppercase tracking-tighter text-white/40 font-bold">thèmes</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 pt-2">
          <button
            onClick={() => onClick(cert)}
            className="group/btn relative flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all overflow-hidden"
            style={{ background: THEME.accent, color: 'white' }}
          >
            <span className="relative z-10">Lancer l'examen</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          </button>
          <button
            className="flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-white/5 bg-white/5 text-white transition-all hover:bg-white/10"
          >
            Voir le contenu
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════ */
const ExamLibrary = () => {
  const navigate = useNavigate();
  const [certs,   setCerts]   = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search,       setSearch]       = useState('');
  const [activeDomain, setActiveDomain] = useState('');
  const [activeLevel,  setActiveLevel]  = useState('');
  const [activeDuration, setActiveDuration] = useState('');
  const [sortBy,       setSortBy]       = useState('A -> Z');

  useEffect(() => {
    Promise.all([
      axios.get(`${BACKEND_URL}/api/certifications`, { withCredentials: true }),
      axios.get(`${BACKEND_URL}/api/certifications/domains`, { withCredentials: true })
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
      setDomains(domainsRes.data?.map(d => d.name) || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);




  const filtered = useMemo(() => {
    let list = [...certs];
    if (activeDomain) list = list.filter(c => (c.category || c.domain) === activeDomain);
    if (search.trim()) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'A -> Z') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [certs, activeDomain, search, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: '#0f0d1a' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position:'absolute', top:'5%',   left:'3%',   width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',    filter:'blur(50px)' }} />
          <div style={{ position:'absolute', top:'15%',  right:'5%',  width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,60,220,0.4) 0%, transparent 70%)',   filter:'blur(40px)' }} />
          <div style={{ position:'absolute', bottom:'10%', left:'30%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(230,120,0,0.3) 0%, transparent 70%)',    filter:'blur(50px)' }} />
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-[#f97316]/20 border-t-[#f97316] animate-spin relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0f0d1a', fontFamily: 'Inter, sans-serif' }}>
      {/* Color orbs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position:'absolute', top:'5%',   left:'3%',   width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',    filter:'blur(50px)' }} />
        <div style={{ position:'absolute', top:'15%',  right:'5%',  width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,60,220,0.4) 0%, transparent 70%)',   filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'30%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(230,120,0,0.3) 0%, transparent 70%)',    filter:'blur(50px)' }} />
        <div style={{ position:'absolute', bottom:'5%',  right:'10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(220,50,150,0.35) 0%, transparent 70%)',  filter:'blur(35px)' }} />
      </div>

      <div className="flex-1 max-w-6xl mx-auto flex flex-col gap-8 px-6 md:px-8 pt-6 pb-20 w-full relative z-10">
        
        {/* ── Search & Filters Bar ───────────────────────────────── */}
        <div className="bg-[#161b22] border border-white/5 rounded-xl p-6 flex flex-col gap-5">
          {/* Search Row */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                placeholder="Rechercher une certification..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0d0e14]/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/30 focus:bg-[#0d0e14] transition-all"
              />
            </div>
            <div className="flex items-baseline gap-1 mr-2">
              <span className="text-2xl font-black" style={{ color: THEME.accent }}>{filtered.length}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">examens</span>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown 
              label="Tous domaines" 
              value={activeDomain} 
              options={domains} 
              onChange={setActiveDomain} 
            />
            <FilterDropdown 
              label="Tous niveaux" 
              value={activeLevel} 
              options={['Débutant', 'Intermédiaire', 'Avancé']} 
              onChange={setActiveLevel} 
            />
            <FilterDropdown 
              label="Toutes durées" 
              value={activeDuration} 
              options={['< 30 min', '30-60 min', '> 60 min']} 
              onChange={setActiveDuration} 
            />
            <FilterDropdown 
              label="A -> Z" 
              value={sortBy} 
              options={['A -> Z', 'Z -> A', 'Plus récents']} 
              onChange={setSortBy} 
            />
          </div>
        </div>

        {/* ── Grid ───────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#161b22] rounded-xl border border-white/5">
            <GraduationCap size={40} className="mx-auto mb-3 opacity-20 text-white" />
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest">Aucun résultat trouvé</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cert => (
              <CertCard 
                key={cert.mode_id || cert.cert_id} 
                cert={cert} 
                onClick={(c) => navigate(`/exam/${c.mode_id || c.cert_id}`)} 
              />
            ))}
          </div>
        )}
      </div>
      <div className="relative z-10 mt-auto w-[100vw] ml-[calc(-50vw+50%)]">
        <Footer />
      </div>
    </div>
  );
};

export default ExamLibrary;
