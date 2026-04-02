import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  question_id: string;
  text: string;
  type: string;
  options?: string[];
  answer: string | number;
  score?: number;
}

interface GameQuestionOverlayProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  playSuccess?: () => void;
  playFail?: () => void;
  playClick?: () => void;
}

const GameQuestionOverlay: React.FC<GameQuestionOverlayProps> = ({ 
  question, 
  onAnswer,
  playSuccess,
  playFail,
  playClick
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = (option: string, index: number) => {
    if (selected !== null) return;
    
    if (playClick) playClick();

    setSelected(option);
    const correct = question.type === 'true_false' 
      ? option === question.answer.toString()
      : index.toString() === question.answer.toString();
    
    setIsCorrect(correct);
    if (correct) {
      if (playSuccess) playSuccess();
    } else {
      if (playFail) playFail();
    }
    
    setTimeout(() => {
      onAnswer(correct);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-admin-bg/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-admin-card border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="p-3 bg-admin-accent/20 rounded-2xl text-admin-accent">
            <HelpCircle size={24} />
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-black px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Star size={16} fill="currentColor" />
            <span className="text-sm">BONUS: {question.score || 10} PTS</span>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-8 leading-tight">
          {question.text}
        </h3>

        <div className="space-y-3">
          {question.type === 'true_false' ? (
            ['Vrai', 'Faux'].map((val) => (
              <button
                key={val}
                onClick={() => handleSelect(val, val === 'Vrai' ? 0 : 1)}
                className={`w-full py-5 px-6 rounded-2xl border-2 font-bold text-lg transition-all flex justify-between items-center
                  ${selected === val 
                    ? (isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400')
                    : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20 active:scale-[0.98]'
                  }`}
              >
                {val}
                {selected === val && (
                  isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />
                )}
              </button>
            ))
          ) : (
            question.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(opt, i)}
                className={`w-full py-4 px-6 rounded-2xl border-2 font-bold text-sm transition-all flex justify-between items-center group
                  ${selected === opt 
                    ? (isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400')
                    : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20 active:scale-[0.98]'
                  }`}
              >
                <span className="flex items-center gap-4 text-left">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors
                    ${selected === opt ? (isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20') : 'bg-black/20 group-hover:bg-black/40'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
                {selected === opt && (
                  isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />
                )}
              </button>
            ))
          )}
        </div>

        {/* Decorative background flash */}
        <AnimatePresence>
          {isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 pointer-events-none ${isCorrect ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default GameQuestionOverlay;
