import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

const BrebisPerdue = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [sheepPosition, setSheepPosition] = useState({ top: '50%', left: '50%' });
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameActive(false);
      onSubmit({ score });
    }
  }, [timeLeft, gameActive]);

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
    if (!gameActive) return;
    setScore(score + 1);
    moveSheep();
  };

  return (
    <div className="max-w-2xl mx-auto">
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
        className="relative h-[400px] bg-emerald-900/40 border-white/10 overflow-hidden cursor-crosshair rounded-3xl"
        onClick={moveSheep} // Clicking background doesn't count
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
    </div>
  );
};

export default BrebisPerdue;
