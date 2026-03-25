import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

const MultiplierPains = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [items, setItems] = useState<any[]>([]);
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
        type: Math.random() > 0.2 ? 'bread' : 'stone',
        emoji: Math.random() > 0.2 ? '🍞' : '🪨'
      };
      setItems(prev => [...prev, newItem]);
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== newItem.id)), 2500);
    }, 700);
    return () => clearInterval(interval);
  }, [gameActive]);

  return (
    <div className="max-w-4xl mx-auto select-none">
      <div className="flex justify-between mb-6 text-white bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="text-xl font-bold text-admin-accent">Pains multipliés: {score}</div>
        <div className="text-xl font-bold text-white/60">Temps: {timeLeft}s</div>
      </div>

      <Card className="relative h-[500px] bg-gradient-to-b from-orange-400/10 to-orange-900/40 border-white/10 overflow-hidden shadow-2xl rounded-3xl">
        <div className="absolute inset-0">
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ y: -50, x: `${item.x}%`, opacity: 0 }}
              animate={{ y: 550, opacity: 1 }}
              transition={{ duration: 2.5, ease: 'linear' }}
              className="absolute cursor-pointer text-6xl hover:scale-110 active:scale-90 transition-transform"
              onClick={() => {
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
    </div>
  );
};

export default MultiplierPains;
