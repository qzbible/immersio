import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, Clock, ArrowRight, ShieldAlert, Target, Star, ChevronLeft, Target as TargetIcon, ChevronDown, ChevronUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const THEME = {
  accent: '#f97316',
  bg: '#0f0d1a',
  card: '#161b22',
};

const MyEvaluations = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});

  const toggleModule = (eId) => {
    setExpandedModules(prev => ({ ...prev, [eId]: !prev[eId] }));
  };

  useEffect(() => {
    Promise.all([
      axios.get(`${BACKEND_URL}/api/certifications/attempts`, { withCredentials: true }),
      axios.get(`${BACKEND_URL}/api/certifications`)
    ])
      .then(([attRes, certRes]) => {
        setAttempts(attRes.data || []);
        setCerts(certRes.data || []);
      })
      .catch(err => console.error("Could not fetch evaluations", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: THEME.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position:'absolute', top:'5%',   left:'3%',   width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',    filter:'blur(50px)' }} />
          <div style={{ position:'absolute', top:'15%',  right:'5%',  width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%)',   filter:'blur(40px)' }} />
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-[#f97316]/20 border-t-[#f97316] animate-spin relative z-10" />
      </div>
    );
  }

  // 1. Group by Exam ID
  const grouped = attempts.reduce((acc, curr) => {
    const eId = curr.exam_id;
    if (!acc[eId]) acc[eId] = { exam_name: curr.exam_name, passes: [] };
    acc[eId].passes.push(curr);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-20 px-4 md:px-12 pt-6 relative overflow-hidden" style={{ background: THEME.bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Background Galactique */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position:'absolute', top:'5%',   left:'3%',   width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',    filter:'blur(50px)' }} />
        <div style={{ position:'absolute', top:'15%',  right:'5%',  width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,60,220,0.4) 0%, transparent 70%)',   filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'30%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(230,120,0,0.3) 0%, transparent 70%)',    filter:'blur(50px)' }} />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/certifications')} 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#f97316] transition-all"
          >
            <ChevronLeft size={16} /> Retour à l'accueil
          </button>
        </div>

        <div className="bg-[#161b22] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316] opacity-[0.05] blur-[80px] pointer-events-none" />
          <div className="flex items-center gap-4 mb-2">
            <ClipboardList className="text-[#f97316]" size={32} />
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Mes Évaluations</h1>
          </div>
          <p className="text-white/40 max-w-xl text-sm">
            Historique complet de vos examens et certifications. Analysez vos performances et préparez-vous efficacement pour vos prochains objectifs.
          </p>
        </div>

        {/* List */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 bg-[#161b22] rounded-xl border border-white/5">
            <TargetIcon size={40} className="mx-auto mb-3 opacity-20 text-white" />
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest">Aucune évaluation passée</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {Object.entries(grouped).map(([examId, groupData]) => {
              // Get baseline DB cert for this exam
              const baselineCert = certs.find(c => (c.cert_id === examId || c.mode_id === examId));
              const totalQuestionsDb = baselineCert?.question_count || 100;

              // Aggregate attempts
              const allAttempts = groupData.passes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              
              // Unique questions seen
              const seenQuestions = new Set();
              let bestScore = 0;
              allAttempts.forEach(att => {
                if (att.score > bestScore) bestScore = att.score;
                (att.responses || []).forEach(r => seenQuestions.add(r.question_id));
              });

              const seenCount = seenQuestions.size;
              const remainingCount = Math.max(0, totalQuestionsDb - seenCount);
              const coveragePct = Math.round((seenCount / totalQuestionsDb) * 100);

              const isExpanded = !!expandedModules[examId];

              return (
                <div key={examId} className="flex flex-col gap-4">
                  
                  {/* Module Header card */}
                  <div 
                    onClick={() => toggleModule(examId)}
                    className="p-6 rounded-2xl bg-[#0d0b1a] border border-[#f97316]/20 relative overflow-hidden shadow-[0_10px_30px_rgba(249,115,22,0.05)] cursor-pointer group hover:border-[#f97316]/40 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316] opacity-[0.03] blur-[80px] pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Star className="text-[#f97316]" size={20} />
                          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            {groupData.exam_name}
                          </h2>
                        </div>
                        <p className="text-sm text-white/40">Fusion des {allAttempts.length} tentative(s) sur ce module.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-4 md:gap-6 bg-black/40 p-4 rounded-xl border border-white/5">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-[#10b981] tracking-widest mb-1">Meilleur Score</span>
                            <span className="text-2xl font-black text-white">{bestScore}%</span>
                          </div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-[#f97316] tracking-widest mb-1">Questions vues</span>
                            <span className="text-2xl font-black text-white">{seenCount} <span className="text-xs text-white/30">/ {totalQuestionsDb}</span></span>
                          </div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-[#3b82f6] tracking-widest mb-1">Restantes</span>
                            <span className="text-2xl font-black text-white">{remainingCount}</span>
                          </div>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-white/10 transition-all shrink-0">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#f97316]/50 to-[#f97316]" style={{ width: `${coveragePct}%` }} />
                    </div>
                  </div>

                  {/* Individual Attempts List */}
                  {isExpanded && (
                    <div className="grid gap-3 pl-0 md:pl-6 border-l-0 md:border-l border-dashed border-white/10 mt-1 mb-4 animate-in slide-in-from-top-2 fade-in duration-300">
                      {allAttempts.map(attempt => {
                        const dateObj = new Date(attempt.created_at);
                        const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                        const formattedTime = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        
                        const qCount = attempt.responses?.length || 0;
                        let attPassRate = 0;
                        if (qCount > 0) {
                           const correctC = attempt.responses.filter(r => r.is_correct).length;
                           attPassRate = Math.round((correctC / qCount) * 100);
                        }
                        const isSuccess = attPassRate >= 70;

                        return (
                          <div 
                            key={attempt.attempt_id} 
                            onClick={() => navigate(`/evaluations/${attempt.attempt_id}`)}
                            className="group/item flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#161b22] border border-white/5 hover:border-[#f97316]/30 hover:bg-[#1c222b] transition-all cursor-pointer relative overflow-hidden"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
                              <div>
                                <p className="text-sm font-bold text-white tracking-wide">
                                  Tentative du {formattedDate} à {formattedTime}
                                </p>
                                <p className="text-xs text-white/30 font-medium">Cliquez pour voir la correction détaillée</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Score du test</span>
                                <span className="text-base font-black text-white">{attempt.score}%</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Taux de réussite</span>
                                <span className="text-base font-black" style={{ color: isSuccess ? '#10b981' : '#f97316' }}>{attPassRate}%</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Temps</span>
                                <span className="text-sm font-mono font-bold text-white/70">{Math.floor(attempt.duration_seconds / 60)}m {attempt.duration_seconds % 60}s</span>
                              </div>
                              <ArrowRight size={14} className="text-white/20 group-hover/item:text-[#f97316] transition-colors ml-2" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvaluations;
