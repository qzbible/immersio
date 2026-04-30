import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import axios from 'axios';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const MultiplierPains = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [items, setItems] = useState<any[]>([]);
  const [gameActive, setGameActive] = useState(true);

  // Hybrid states
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState(30);

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
    if (questionsPool.length > 0 && (lastQuestionTime - currentTime) >= 10) {
      triggerQuestion();
    }
  };

  const triggerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    setCurrentQuestion(questionsPool[randomIndex]);
    setIsPaused(true);
    setLastQuestionTime(timeLeft);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore(prev => prev + 10);
    setCurrentQuestion(null);
    setIsPaused(false);
  };

  useEffect(() => {
    if (!gameActive || isPaused) return;
    const interval = setInterval(() => {
      const newItem = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        type: Math.random() > 0.2 ? 'bread' : 'stone',
        emoji: Math.random() > 0.2 ? '🍞' : '🪨'
      };
      setItems(prev => [...prev, newItem]);
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== newItem.id)), 2500);
    }, 700);
    return () => clearInterval(interval);
  }, [gameActive, isPaused]);

  return (
    <div className="max-w-4xl mx-auto select-none relative">
      <div className="flex justify-between mb-6 text-white bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="text-xl font-bold text-admin-accent">Pains multipliés: {score}</div>
        <div className="text-xl font-bold text-white/60">Temps: {timeLeft}s</div>
      </div>

      <Card className={`relative h-[500px] bg-gradient-to-b from-orange-400/10 to-orange-900/40 border-white/10 overflow-hidden shadow-2xl rounded-3xl transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="absolute inset-0">
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ y: -50, x: `${item.x}%`, opacity: 0 }}
              animate={isPaused ? { y: 0, opacity: 1 } : { y: 550, opacity: 1 }}
              transition={isPaused ? { duration: 0 } : { duration: 2.5, ease: 'linear' }}
              className="absolute cursor-pointer text-6xl hover:scale-110 active:scale-90 transition-transform"
              onClick={() => {
                if (isPaused) return;
                if (item.type === 'bread') setScore(score + 1);
                else setScore(Math.max(0, score - 2));
                setItems(prev => prev.filter(i => i.id !== item.id));
              }}
              style={{ left: `${item.x}%` }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </div>

        {!gameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-20">
            <div className="text-center">
              <p className="text-6xl font-black text-admin-yellow mb-4">FIN DU TEST</p>
              <p className="text-3xl text-white font-medium">Score: {score}</p>
            </div>
          </div>
        )}
      </Card>

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

export default MultiplierPains;
