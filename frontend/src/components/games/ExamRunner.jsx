import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Circle, Square, AlignLeft, Clock } from 'lucide-react';

const S = { fontFamily: 'Inter, sans-serif' };

/* ── Timer & Progress Header ────────────────────────────────────── */
const ExamHeader = ({ current, total, timeLeft, timeTotal }) => {
  const pctTime = timeTotal > 0 ? (timeLeft / timeTotal) * 100 : 0;
  const timeColor = timeLeft < 30 ? '#ef4444' : '#ffffff';
  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, '0');
  
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-4">
        {/* Timer Box */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#161b22] border border-white/5 min-w-[100px] justify-center">
          <Clock size={16} className="text-white/40" />
          <span className="text-sm font-mono font-black tracking-wider" style={{ color: timeColor }}>
            {mm}:{ss}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 relative">
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#f97316]/40 to-[#f97316] transition-all duration-1000 ease-linear"
              style={{ width: `${pctTime}%` }}
            />
          </div>
          {/* Subtle marker for overall completion */}
          <div className="absolute -bottom-5 right-0 text-[10px] uppercase font-black tracking-widest text-white/20">
            {current + 1} / {total}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Square Navigation Grid ────────────────────────────────────── */
const NavGrid = ({ total, current, answers, onClick }) => (
  <div className="flex flex-wrap gap-2 py-6 border-t border-white/5">
    {Array.from({ length: total }, (_, i) => {
      const answered = answers[i] !== undefined && answers[i] !== null && answers[i] !== '';
      const active   = i === current;
      return (
        <button
          key={i}
          onClick={() => onClick(i)}
          className="w-10 h-10 rounded-lg text-xs font-black transition-all border shrink-0"
          style={{
            background: active ? '#f97316' : answered ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderColor: active ? '#f97316' : answered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
            color: active ? 'white' : answered ? 'white' : 'rgba(255,255,255,0.2)',
          }}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);

/* ── TYPE BADGE ─────────────────────────────────────────────────── */
const TypeBadge = ({ type }) => {
  const MAP = {
    multiple_choice: { label: 'QCM', color: '#f97316' },
    single_choice:   { label: 'QCM', color: '#f97316' }, // Use same for parity
    true_false:      { label: 'V/F', color: '#f97316' },
    short_answer:    { label: 'TEXTE', color: '#f97316' },
  };
  const cfg = MAP[type] || { label: 'EXAM', color: '#f97316' };
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#f97316]/30 bg-[#f97316]/10 mb-5">
      <span className="text-[9px] font-black tracking-tighter text-[#f97316]">{cfg.label}</span>
    </div>
  );
};

/* ── CHOICE BUTTON ──────────────────────────────────────────────── */
const ChoiceBtn = ({ index, label, selected, onClick, multi = false }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-5 rounded-xl text-left transition-all group mb-3 last:mb-0"
    style={{
      background: selected ? 'rgba(249,115,22,0.03)' : '#161b22',
      border: `1px solid ${selected ? '#f97316' : 'rgba(255,255,255,0.05)'}`,
    }}
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all"
      style={{
        background: selected ? '#f97316' : 'rgba(255,255,255,0.02)',
        borderColor: selected ? '#f97316' : 'rgba(255,255,255,0.1)',
        color: selected ? 'white' : 'rgba(255,255,255,0.3)',
      }}
    >
      {String.fromCharCode(65 + index)}
    </div>
    <span className="text-sm font-medium" style={{ color: selected ? 'white' : 'rgba(255,255,255,0.6)' }}>
      {typeof label === 'object' ? label.text : label}
    </span>
  </button>
);

/* ── RENDERERS ──────────────────────────────────────────────────── */
const SingleChoice = ({ question, value, onChange }) => (
  <div className="mt-8">
    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">SÉLECTIONNEZ UNE RÉPONSE</h4>
    {question.options?.map((opt, i) => (
      <ChoiceBtn key={i} index={i} label={opt} selected={value === i} onClick={() => onChange(i)} />
    ))}
  </div>
);

const TrueFalse = ({ value, onChange }) => (
  <div className="mt-8">
    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">CHOISISSEZ VOTRE RÉPONSE</h4>
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onChange(true)}
        className="flex items-center gap-3 p-5 rounded-xl border transition-all"
        style={{
          background: value === true ? 'rgba(249,115,22,0.03)' : '#161b22',
          borderColor: value === true ? '#f97316' : 'rgba(255,255,255,0.05)',
        }}
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${value === true ? 'bg-[#f97316] border-[#f97316]' : 'border-white/10'}`}>
          {value === true && <Check size={14} className="text-white" />}
        </div>
        <span className="text-sm font-bold text-white">Vrai</span>
      </button>
      <button
        onClick={() => onChange(false)}
        className="flex items-center gap-3 p-5 rounded-xl border transition-all"
        style={{
          background: value === false ? 'rgba(249,115,22,0.03)' : '#161b22',
          borderColor: value === false ? '#f97316' : 'rgba(255,255,255,0.05)',
        }}
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${value === false ? 'bg-[#f97316] border-[#f97316]' : 'border-white/10'}`}>
          {value === false && <X size={14} className="text-white" />}
        </div>
        <span className="text-sm font-bold text-white">Faux</span>
      </button>
    </div>
  </div>
);

const ShortAnswer = ({ value, onChange }) => (
  <div className="mt-8">
    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">ENTREZ VOTRE RÉPONSE</h4>
    <textarea
      className="w-full p-5 rounded-xl text-sm outline-none transition-all border"
      style={{
        background: '#161b22',
        borderColor: 'rgba(255,255,255,0.05)',
        color: 'white',
        minHeight: 120,
      }}
      placeholder="Votre réponse..."
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onFocus={e => e.target.style.borderColor = '#f97316'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
    />
  </div>
);

/* ── VERIFICATION PHASE ─────────────────────────────────────────── */
const VerificationPhase = ({ questions, answers, timeLeft, onEditItem, onSubmit, onBack }) => {
  const answeredCount = questions.filter((_, i) => answers[i] !== undefined && answers[i] !== '').length;
  const total = questions.length;
  
  const mm = Math.floor(timeLeft / 60);
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="max-w-4xl mx-auto w-full pt-10 pb-32" style={S}>
      <div className="rounded-[24px] border border-white/5 bg-[#0d0e14] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#161b22]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            Vérification <span className="text-white/40 text-sm font-normal">({answeredCount}/{total})</span>
          </h2>
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-white/5 text-sm font-bold text-white">
            <Clock size={16} className="text-white/40" />
            {mm}:{ss}
          </div>
        </div>

        {/* List */}
        <div className="p-6 space-y-2">
          {questions.map((q, i) => {
            const isAnswered = answers[i] !== undefined && answers[i] !== '';
            return (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/5 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAnswered ? 'bg-[#10b981]' : 'bg-red-500'}`} />
                  <span className="text-white/40 text-xs font-bold w-4">{i + 1}</span>
                  <p className="text-white text-sm truncate font-medium">{q.text}</p>
                </div>
                <button 
                  onClick={() => onEditItem(i)}
                  className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#161b22] flex gap-4">
          <button 
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white bg-black/50 hover:bg-black border border-white/5 transition-colors"
          >
            <ChevronLeft size={16} /> Retour
          </button>
          <button 
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white bg-[#10b981] hover:bg-[#059669] transition-colors"
          >
            Valider <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════ */
const ExamRunner = ({ questions = [], sessionId, onSubmit }) => {
  const total = questions.length;
  const [phase, setPhase] = useState('exam'); // 'exam' or 'verification'
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers]  = useState({});
  
  // Global timer: 1 minute (60s) per question.
  const [timeLeft, setTimeLeft] = useState(total * 60);
  const timerRef = useRef(null);

  // We need a stable reference to answers for auto-submission on timeout
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const submitExam = (currentAnswers, timeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const payload = {};
    questions.forEach((q, i) => { 
      if (currentAnswers[i] !== undefined) payload[q.question_id] = currentAnswers[i]; 
    });
    onSubmit(payload);
  };

  useEffect(() => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            submitExam(answersRef.current, true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    
    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  const handleAnswer = (val) => setAnswers(prev => ({ ...prev, [current]: val }));
  const handleNext = useCallback(() => { 
    if (current < total - 1) {
      setCurrent(c => c + 1); 
    } else {
      setPhase('verification');
    }
  }, [current, total]);
  
  const handlePrev = () => { if (current > 0) setCurrent(c => c - 1); };

  if (phase === 'verification') {
    return (
      <VerificationPhase 
        questions={questions} 
        answers={answers} 
        timeLeft={timeLeft}
        onEditItem={(idx) => { setCurrent(idx); setPhase('exam'); }}
        onSubmit={() => submitExam(answers)}
        onBack={() => setPhase('exam')}
      />
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="max-w-3xl mx-auto w-full pt-10 pb-32" style={S}>
      {/* Header with Stats */}
      <ExamHeader current={current} total={total} timeLeft={timeLeft} timeTotal={total * 60} />

      {/* Main Question Card */}
      <div className="rounded-[32px] p-8 md:p-12 mb-8 bg-[#161b22] border border-white/5 relative">
        {/* Accent Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316] opacity-[0.02] blur-[80px] pointer-events-none" />
        
        <TypeBadge type={q.type || 'single_choice'} />
        <h3 className="text-xl md:text-2xl font-black text-white leading-snug mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {q.text}
        </h3>
        
        {/* Renderers */}
        {(q.type === 'single_choice' || !q.type) && <SingleChoice question={q} value={answers[current]} onChange={handleAnswer} />}
        {q.type === 'multiple_choice' && <SingleChoice question={q} value={answers[current]} onChange={handleAnswer} />}
        {q.type === 'true_false' && <TrueFalse value={answers[current]} onChange={handleAnswer} />}
        {q.type === 'short_answer' && <ShortAnswer value={answers[current]} onChange={handleAnswer} />}

        {/* Navigation Grid */}
        <div className="mt-12">
          <NavGrid total={total} current={current} answers={answers} onClick={setCurrent} />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={current === 0}
          className="flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 text-white/40 hover:text-white hover:border-white/20 disabled:opacity-20"
        >
          <ChevronLeft size={16} /> Précédent
        </button>

        {current < total - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-3 px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-white text-[#0d0e14] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => setPhase('verification')}
            className="flex items-center gap-3 px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-[#10b981] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Vérifier <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamRunner;
