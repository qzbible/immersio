import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Play, Clock, FileText, Target, RotateCcw,
  BookOpen, CheckCircle, XCircle, ChevronDown, ChevronUp,
  GraduationCap, Zap, ShieldAlert, Star, Flame, Crown,
  Check, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useEffect } from 'react';
import ExamRunner from '@/components/games/ExamRunner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/* ── Difficulté config ─────────────────────────────────────────── */
const DIFFICULTIES = [
  { value: 'très faible',  label: 'Très faible',  icon: ShieldAlert, color: '#00c48c' },
  { value: 'faible',       label: 'Facile',        icon: Target,      color: '#3b82f6' },
  { value: 'moyen',        label: 'Intermédiaire', icon: Star,        color: '#eab308' },
  { value: 'audessus',     label: 'Avancé',        icon: Zap,         color: '#f97316' },
  { value: 'fort',         label: 'Difficile',     icon: Flame,       color: '#ef4444' },
  { value: 'tres fort',    label: 'Expert',        icon: Crown,       color: '#a855f7' },
];

const S = { fontFamily: 'Inter, sans-serif' };

/* ════════════════════════════════════════════════════════════════ */
const ExamWrapper = () => {
  const navigate  = useNavigate();
  const { modeId } = useParams();

  const [phase, setPhase]               = useState('pregame'); // pregame | playing | result | review
  const [selectedDiff, setSelectedDiff] = useState(DIFFICULTIES[2]); // Intermédiaire par défaut

  const [loading, setLoading]           = useState(false);
  const [session, setSession]           = useState(null);
  const [cert, setCert]                 = useState(null);
  const [result, setResult]             = useState(null);
  const [expandedQ, setExpandedQ]       = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get('review');
    if (reviewId) {
      fetchReview(reviewId);
    }
  }, [modeId]);

  const fetchReview = async (sid) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/exam/session/${sid}`, { withCredentials: true });
      // The session should be marked as completed
      setResult(res.data);
      setPhase('review');
    } catch (e) {
      console.error("Failed to fetch review", e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Phase 1 : Difficulty ─────────────────────────────────── */
  const handleDiffSelect = (d) => {
    setSelectedDiff(d);
    setPhase('pregame');
  };

  /* ── Phase 2 → 3 : Start Exam ────────────────────────────── */
  const startExam = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/exam/start`,
        { cert_id: modeId, difficulty: selectedDiff?.value, num_questions: 20 },
        { withCredentials: true }
      );
      setSession(res.data);
      setCert(res.data.cert);
      setPhase('playing');
    } catch (e) {
      console.error(e);
      alert("Impossible de démarrer l'examen");
      navigate('/certifications');
    } finally {
      setLoading(false);
    }
  };

  /* ── Phase 3 → 4 : Submit ────────────────────────────────── */
  const handleSubmit = async (answers) => {
    if (!session) return;
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/exam/submit`,
        { session_id: session.session_id, answers },
        { withCredentials: true }
      );
      const data = res.data;
      setResult(data);

      try {
        const startTimeStr = session.started_at || session.created_at;
        const startTime = startTimeStr ? new Date(startTimeStr) : new Date();
        const durationSeconds = Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000));
        
        const attemptPayload = {
          exam_id: modeId,
          score: data.score_pct || 0,
          duration_seconds: durationSeconds,
          responses: (session.questions || []).map(q => {
             const user_q_result = (data.question_results || []).find(qr => qr.question_id === q.question_id);
             
             const u_ans = user_q_result ? user_q_result.user_answer : (answers[q.question_id] ?? null);
             const is_corr = user_q_result ? user_q_result.is_correct : false;
             const c_ans = user_q_result ? user_q_result.correct_answer : (q.correct_answer || null);
             const explanation = user_q_result ? user_q_result.explanation : (q.explanation || null);
             
             return {
                question_id: q.question_id,
                question_text: q.text,
                user_answer: u_ans,
                correct_answer: c_ans,
                is_correct: is_corr,
                explanation: explanation
             };
          })
        };
        
        await axios.post(`${BACKEND_URL}/api/certifications/attempts`, attemptPayload, { withCredentials: true });
      } catch (err) {
        console.error("Failed to track attempt", err);
      }

      // Skip the 'result' scorecard and go directly to detailed correction
      setPhase('review');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la soumission');
    }
  };


  /* ── PHASE : Pre-exam ─────────────────────────────────────── */
  if (phase === 'pregame') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0d0e14', ...S }}>
        {/* Header navigation */}
        <div className="flex items-center px-4 py-8 max-w-5xl mx-auto w-full">
          <button 
            onClick={() => navigate('/certifications')} 
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#f97316] transition-all"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Retour à la bibliothèque
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-20">
          <div className="w-full max-w-xl">
            {/* Main Briefing Card */}
            <div
              className="rounded-[32px] overflow-hidden relative"
              style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Top Accent Ring */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#f97316] to-transparent opacity-50" />
              
              <div className="p-8 md:p-12 relative">
                {/* Icon & Title */}
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#f97316]/10 border border-[#f97316]/20">
                    <CheckCircle size={32} className="text-[#f97316]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {cert?.name || modeId?.replace(/_/g, ' ')} — <span className="text-[#f97316]">{selectedDiff.label}</span>
                    </h2>
                    <p className="text-sm text-white/40 mt-1">
                      Validation officielle des compétences et maîtrise technique.
                    </p>
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="flex flex-wrap gap-3 mb-10">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <FileText size={14} className="text-white/30" />
                    <span className="text-xs font-bold text-white/80">20 épreuves</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Clock size={14} className="text-white/30" />
                    <span className="text-xs font-bold text-white/80">20 min.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <Target size={14} className="text-white/30" />
                    <span className="text-xs font-bold text-white/80">70% requis</span>
                  </div>
                </div>

                {/* Info Block */}
                <div className="rounded-2xl p-6 mb-10 bg-[#0d0e14]/50 border border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">MODALITÉS</h4>
                  <ul className="space-y-4">
                    {[
                      'Le chronomètre démarre dès le lancement',
                      'Mixte : QCM, Vrai/Faux et Réponses Courtes',
                      'Navigation libre entre les épreuves',
                      'Score de validation minimum : 70%',
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="w-1 h-1 rounded-full bg-[#f97316] mt-2 group-hover:scale-150 transition-transform" />
                        <span className="text-xs font-medium text-white/60 leading-relaxed">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Start Button */}
                <button
                  onClick={startExam}
                  disabled={loading}
                  className="group/btn relative w-full overflow-hidden rounded-2xl p-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-x-0 bottom-0 top-0 bg-[#f97316]" />
                  <div className="relative flex items-center justify-center gap-3 py-4 md:py-5 px-8">
                    <Play size={18} fill="white" className="text-white" />
                    <span className="text-sm font-black uppercase tracking-widest text-white">
                      {loading ? 'Préparation...' : "Lancer l'examen"}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PHASE : Playing ──────────────────────────────────────── */
  if (phase === 'playing') {
    const questions = session?.questions || [];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bq-bg)', ...S }}>
        {/* Top bar */}
        <div
          className="sticky z-10 flex items-center justify-between px-4 md:px-8 py-3"
          style={{ 
            top: "56px",
            background: 'var(--bq-bg-card)', 
            borderBottom: '1px solid var(--bq-border)' 
          }}
        >
          <span className="text-sm font-bold" style={{ color: 'var(--bq-text)' }}>
            {cert?.name || modeId?.replace(/_/g, ' ')}
          </span>
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: `${selectedDiff.color}18`, color: selectedDiff.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: selectedDiff.color }} />
            {selectedDiff.label}
          </span>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 max-w-2xl mx-auto w-full">
          {questions.length > 0 ? (
            <ExamRunner
              questions={questions}
              sessionId={session.session_id}
              onSubmit={handleSubmit}
              timePerQuestion={90}
            />
          ) : (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--bq-text)' }} />
              <p className="text-sm mb-6" style={{ color: 'var(--bq-text-muted)' }}>
                Aucune épreuve disponible pour cette certification
              </p>
              <button
                onClick={() => navigate('/certifications')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#f97316', color: 'white' }}
              >
                Retour à la bibliothèque
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PHASE : Review (Correction détaillée) ─────────────────── */
  if (phase === 'review' && (result || reviewData)) {
    const data = result || reviewData;
    const questions = data.question_results || [];
    
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0d0e14', ...S }}>
        {/* Header navigation */}
        <div className="flex items-center justify-between px-4 py-8 max-w-4xl mx-auto w-full">
          <button 
            onClick={() => navigate('/certifications')} 
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#f97316] transition-all"
          >
            <ChevronLeft size={16} /> Retour au catalogue
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>Correction détaillée</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f97316]">{data.cert_name}</p>
          </div>
          <div className="w-40" />
        </div>

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-20">
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {questions.map((q, i) => (
              <button
                key={i}
                className={`w-10 h-10 rounded-lg text-xs font-black transition-all border ${q.is_correct ? 'bg-[#00c48c]/10 border-[#00c48c]/30 text-[#00c48c]' : 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]'}`}
                onClick={() => {
                  const el = document.getElementById(`q-${i}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {questions.map((q, i) => (
              <div id={`q-${i}`} key={i} className="rounded-3xl p-8 bg-[#161b22] border border-white/5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${q.is_correct ? 'bg-[#00c48c]' : 'bg-[#f97316]'}`} />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Épreuve {i + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${q.is_correct ? 'bg-[#00c48c]/10 text-[#00c48c]' : 'bg-[#f97316]/10 text-[#f97316]'}`}>
                      {q.is_correct ? 'Validé' : 'Échec'}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white/90 leading-relaxed mb-6">{q.text}</h3>

                <div className="space-y-3 mb-8">
                  {q.type === 'short_answer' ? (
                    <div className="space-y-4">
                       <div className="p-4 rounded-xl bg-[#0d0e14]/50 border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Votre réponse</p>
                        <p className={`text-sm font-medium ${q.is_correct ? 'text-[#00c48c]' : 'text-[#f97316]'}`}>{q.user_answer || '(Vide)'}</p>
                      </div>
                      {!q.is_correct && (
                        <div className="p-4 rounded-xl bg-[#00c48c]/5 border border-[#00c48c]/20">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#00c48c]/60 mb-2">Réponse attendue</p>
                          <p className="text-sm font-bold text-[#00c48c]">{q.correct_answer}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    q.options?.map((opt, idx) => {
                      const isUserAnswer = Array.isArray(q.user_answer) ? q.user_answer.includes(idx) : q.user_answer === idx;
                      const isCorrectAnswer = Array.isArray(q.correct_answer) ? q.correct_answer.includes(idx) : q.correct_answer === idx;
                      let st = "bg-white/[0.02] border-white/5 text-white/40";
                      if (isCorrectAnswer) st = "bg-[#00c48c]/10 border-[#00c48c]/30 text-[#00c48c]";
                      else if (isUserAnswer && !isCorrectAnswer) st = "bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]";

                      return (
                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${st}`}>
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border ${isCorrectAnswer ? 'bg-[#00c48c] border-[#00c48c] text-[#0d0e14]' : isUserAnswer ? 'bg-[#f97316] border-[#f97316] text-white' : 'border-white/10'}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm font-medium">{typeof opt === 'object' ? opt.text : opt}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {q.explanation && (
                  <div className="mt-6 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                    <ShieldAlert size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Explication Technique</p>
                      <p className="text-xs text-blue-100/60 leading-relaxed font-medium">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamWrapper;
