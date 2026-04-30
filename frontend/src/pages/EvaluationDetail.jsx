import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const THEME = { bg: '#0f0d1a', card: '#161b22', accent: '#f97316' };

const EvaluationDetail = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/certifications/attempts/${attemptId}`, { withCredentials: true })
      .then(res => setAttempt(res.data))
      .catch(err => {
        console.error("Failed to load attempt", err);
        navigate('/evaluations');
      })
      .finally(() => setLoading(false));
  }, [attemptId, navigate]);

  if (loading || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: THEME.bg }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#f97316]/20 border-t-[#f97316] animate-spin relative z-10" />
      </div>
    );
  }

  const passRate = attempt.responses.length > 0 
    ? Math.round((attempt.responses.filter(r => r.is_correct).length / attempt.responses.length) * 100) 
    : 0;
  
  const isSuccess = passRate >= 70;

  return (
    <div className="min-h-screen pb-20 px-4 md:px-12 pt-6 relative overflow-hidden" style={{ background: THEME.bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Background Galactique */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position:'absolute', top:'5%',   left:'3%',   width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',    filter:'blur(50px)' }} />
      </div>

      <div className="max-w-4xl mx-auto flex flex-col gap-8 relative z-10">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate('/evaluations')} 
          className="self-start flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#f97316] transition-all"
        >
          <ArrowLeft size={16} /> Historique
        </button>

        {/* Global Result Card */}
        <div className="bg-[#161b22] border border-white/5 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-${isSuccess ? '[#10b981]' : '[#ef4444]'} to-transparent opacity-50`} />
          
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-[#f97316] blur-[50px] opacity-10 rounded-full" />
            {isSuccess ? (
              <CheckCircle size={64} className="text-[#10b981] relative z-10" />
            ) : (
              <ShieldAlert size={64} className="text-[#ef4444] relative z-10" />
            )}
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {attempt.exam_name}
          </h1>
          <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-10">Détail de la tentative</p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Score</span>
              <span className="text-3xl font-black text-white">{attempt.score} <span className="text-sm text-white/50">pts</span></span>
            </div>
            <div className="w-px h-12 bg-white/10 hidden md:block" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Réussite</span>
              <span className="text-3xl font-black" style={{ color: isSuccess ? '#10b981' : '#ef4444' }}>{passRate}%</span>
            </div>
            <div className="w-px h-12 bg-white/10 hidden md:block" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Durée</span>
              <span className="text-3xl font-black text-white font-mono flex items-center gap-2">
                <Clock size={20} className="text-[#f97316]" /> {Math.floor(attempt.duration_seconds / 60)}m {attempt.duration_seconds % 60}s
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Correction détaillée
          </h3>
          
          {attempt.responses.map((resp, i) => (
            <div key={resp.question_id} className="p-6 rounded-2xl bg-black/40 border border-white/5">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: resp.is_correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: resp.is_correct ? '#10b981' : '#ef4444' }}
                >
                  {resp.is_correct ? <CheckCircle size={14} /> : <XCircle size={14} />}
                </div>
                <h4 className="text-sm font-bold text-white/90 leading-relaxed">
                  <span className="text-white/30 mr-2">{i + 1}.</span> {resp.question_text}
                </h4>
              </div>

              {/* Answers Grid */}
              <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <p className="text-[10px] uppercase tracking-widest text-[#ef4444] font-bold mb-1">Votre Réponse</p>
                  <p className="text-sm text-white">{String(resp.user_answer || "Non répondu")}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5">
                  <p className="text-[10px] uppercase tracking-widest text-[#10b981] font-bold mb-1">Bonne Réponse</p>
                  <p className="text-sm text-white font-medium">{String(resp.correct_answer)}</p>
                </div>
              </div>

              {/* Explanation Block */}
              {resp.explanation && (
                <div className="ml-10 mt-4 p-4 rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/5 overflow-hidden">
                  <p className="text-[10px] uppercase tracking-widest text-[#3b82f6] font-bold mb-2">Explication</p>
                  <div className="text-sm text-white/80 leading-relaxed max-w-none prose prose-invert prose-p:text-sm prose-p:my-0">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              {...props}
                              children={String(children).replace(/\n$/, '')}
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg !my-4 !bg-[#0b0f19] border border-white/10 text-xs md:text-sm shadow-xl"
                            />
                          ) : (
                            <code {...props} className="bg-white/10 text-[#f97316] px-1.5 py-0.5 rounded text-[0.8em]">
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {resp.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default EvaluationDetail;
