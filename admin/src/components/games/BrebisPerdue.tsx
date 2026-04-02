import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import axios from 'axios';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const BrebisPerdue = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [sheepPosition, setSheepPosition] = useState({ top: '50%', left: '50%' });
  const [gameActive, setGameActive] = useState(true);

  // Hybrid states
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);

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
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      onSubmit({ score });
    }
  }, [timeLeft, gameActive, isPaused]);

  useEffect(() => {
    moveSheep();
  }, []);

  const moveSheep = () => {
    setSheepPosition({
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`
    });
  };

  const handleClick = () => {
    if (!gameActive || isPaused) return;
    const newScore = score + 1;
    setScore(newScore);
    
    // Trigger question every 3 sheep found
    if (newScore > 0 && newScore % 3 === 0 && questionsPool.length > 0) {
      triggerQuestion();
    } else {
      moveSheep();
    }
  };

  const triggerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    setCurrentQuestion(questionsPool[randomIndex]);
    setIsPaused(true);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore(prev => prev + 5); // Bonus score
    setCurrentQuestion(null);
    setIsPaused(false);
    moveSheep();
  };

  return (
    <div className="max-w-2xl mx-auto relative">
      <div className="mb-6 flex justify-between items-center text-white">
        <h2 className="text-2xl font-bold">Trouver la Brebis 🐑</h2>
        <div className="flex gap-4">
          <span className="bg-white/5 px-4 py-2 rounded-xl">Score: {score}</span>
          <span className={`px-4 py-2 rounded-xl ${timeLeft < 5 ? 'bg-red-500/20 text-red-500' : 'bg-white/5'}`}>
            Temps: {timeLeft}s
          </span>
        </div>
      </div>

      <Card 
        className={`relative h-[400px] bg-emerald-900/40 border-white/10 overflow-hidden cursor-crosshair rounded-3xl transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}
        onClick={() => !isPaused && moveSheep()}
      >
        <motion.div
          animate={{ top: sheepPosition.top, left: sheepPosition.left }}
          className="absolute text-5xl cursor-pointer hover:scale-125 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={{ position: 'absolute' }}
        >
          🐑
        </motion.div>

        {!gameActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="text-center text-white">
              <p className="text-5xl font-black text-emerald-400 mb-2">Brebis retrouvées !</p>
              <p className="text-2xl opacity-60">Score: {score}</p>
            </div>
          </div>
        )}
      </Card>
      <p className="text-center text-white/40 mt-4 text-xs font-medium uppercase tracking-widest">Cliquez sur la brebis le plus de fois possible !</p>

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

export default BrebisPerdue;
