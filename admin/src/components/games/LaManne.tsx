import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

const LaManne = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fallingItems, setFallingItems] = useState<any[]>([]);
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
    if (!gameActive) return;
    
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
  }, [gameActive]);

  const handleCatch = (item: any) => {
    if (item.type === 'bread') {
      setScore(score + 1);
    } else {
      setScore(Math.max(0, score - 1));
    }
    setFallingItems(prev => prev.filter(i => i.id !== item.id));
  };

  return (
    <div className="max-w-4xl mx-auto select-none">
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
              animate={{ y: 400 }}
              transition={{ duration: 3, ease: 'linear' }}
              className="absolute cursor-pointer text-5xl hover:scale-110 active:scale-95 transition-transform"
              onClick={() => handleCatch(item)}
              style={{ left: `${item.x}%` }}
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
        </p>
      </div>
    </div>
  );
};

export default LaManne;
