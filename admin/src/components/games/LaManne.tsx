import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import axios from 'axios';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const LaManne = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const [gameData, setGameData] = useState<any>(null);
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [lastQuestionTime, setLastQuestionTime] = useState(30); // Start time

  useEffect(() => {
    fetchGameData();
  }, [modeId]);

  const fetchGameData = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/games/start`,
        { mode_id: modeId },
        { withCredentials: true }
      );
      setGameData(response.data.game_data);
      if (response.data.game_data.questions) {
        setQuestionsPool(response.data.game_data.questions);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && gameActive && !isPaused) {
      const timer = setTimeout(() => {
        const newTime = timeLeft - 1;
        setTimeLeft(newTime);
        checkQuestionTrigger(newTime);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      onSubmit({ score });
    }
  }, [timeLeft, gameActive, isPaused]);

  const checkQuestionTrigger = (currentTime: number) => {
    // Trigger every 10 seconds (e.g. at 20s and 10s)
    if (questionsPool.length > 0 && (lastQuestionTime - currentTime) >= 10) {
      triggerQuestion();
    }
  };

  const triggerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    const q = questionsPool[randomIndex];
    setCurrentQuestion(q);
    setIsPaused(true);
    setLastQuestionTime(timeLeft);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      setScore(prev => prev + 10); // Bonus for correct answer
    }
    setCurrentQuestion(null);
    setIsPaused(false);
  };

  useEffect(() => {
    if (!gameActive || isPaused) return;
    
    const interval = setInterval(() => {
      const newItem = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        type: Math.random() > 0.3 ? 'bread' : 'stone',
        emoji: Math.random() > 0.3 ? '🍞' : '🪨'
      };
      setFallingItems(prev => [...prev, newItem]);
      
      setTimeout(() => {
        setFallingItems(prev => prev.filter(item => item.id !== newItem.id));
      }, 3000);
    }, 800);

    return () => clearInterval(interval);
  }, [gameActive, isPaused]);

  const handleCatch = (item: any) => {
    if (isPaused) return;
    if (item.type === 'bread') {
      setScore(score + 1);
    } else {
      setScore(Math.max(0, score - 1));
    }
    setFallingItems(prev => prev.filter(i => i.id !== item.id));
  };

  return (
    <div className="max-w-4xl mx-auto select-none relative">
      <div className="flex justify-between mb-6 text-white">
        <div className="text-2xl font-bold bg-admin-accent/20 px-4 py-2 rounded-xl text-admin-accent border border-admin-accent/20">Score: {score}</div>
        <div className="text-2xl font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/10">Temps: {timeLeft}s</div>
      </div>

      <Card className="relative h-96 bg-gradient-to-b from-blue-400/10 to-blue-900/40 backdrop-blur-md border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/10">
        <div className="absolute inset-0">
          {fallingItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ y: -50, x: `${item.x}%` }}
              animate={isPaused ? { y: 0 } : { y: 400 }}
              transition={isPaused ? { duration: 0 } : { duration: 3, ease: 'linear' }}
              className="absolute cursor-pointer text-5xl hover:scale-110 active:scale-95 transition-transform"
              onClick={() => handleCatch(item)}
              style={{ left: `${item.x}%`, top: isPaused ? undefined : undefined }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </div>

        {!gameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 animate-in fade-in duration-300">
            <div className="text-center text-white bg-admin-card p-8 rounded-3xl border border-white/10 shadow-2xl">
              <p className="text-5xl font-black mb-4 text-admin-yellow">Terminé !</p>
              <p className="text-2xl font-medium">Score final: <span className="text-admin-accent font-bold">{score}</span></p>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
        <p className="text-white/60">
          Attrapez le pain <span className="text-2xl">🍞</span> (+1) et évitez les pierres <span className="text-2xl">🪨</span> (-1) !
          {questionsPool.length > 0 && <span className="block mt-2 text-admin-accent font-bold">Répondez aux questions pour gagner +10 points !</span>}
        </p>
      </div>

      <AnimatePresence>
        {currentQuestion && (
          <GameQuestionOverlay 
            question={currentQuestion} 
            onAnswer={handleAnswer} 
            playSuccess={playSuccess}
            playFail={playFail}
            playClick={playClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LaManne;
