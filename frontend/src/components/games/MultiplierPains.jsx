import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MultiplierPains = ({ onSubmit, isMultiplayer, initialTimeLeft = 30 }) => {
  const [breads, setBreads] = useState(5);
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [multiplier, setMultiplier] = useState(1);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    if (timeLeft > 0 && gameActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      if (onSubmit) {
        // e.g., 5 breads = 50 pts, 100 breads = 1000 pts
        if (isMultiplayer) onSubmit(null, true, breads * 10);
        else onSubmit({ matches: Math.floor(breads / 10) });
      }
    }
  }, [timeLeft, gameActive, onSubmit, isMultiplayer, breads]);

  const handleClick = () => {
    if (!gameActive) return;
    
    setClicks(clicks + 1);
    setBreads(prev => prev + multiplier);
    
    if (clicks > 0 && clicks % 10 === 0) {
      setMultiplier(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-yellow-400 mb-2">
          {breads} 🍞
        </div>
        <p className="text-blue-200">Pains multipliés</p>
        <div className="mt-4 text-white">
          <span className="text-lg">Multiplicateur: x{multiplier}</span>
          <span className="mx-4">•</span>
          <span className="text-lg">Temps: {timeLeft}s</span>
        </div>
      </div>

      <Card className="p-12 bg-white/10 backdrop-blur-md border-white/20 text-center">
        <p className="text-white text-xl mb-8">
          Cliquez rapidement pour multiplier les pains !
        </p>
        
        <Button
          onClick={handleClick}
          className="w-64 h-64 text-8xl rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 hover:scale-110 transition-all shadow-2xl"
        >
          🍞
        </Button>

        <p className="text-blue-200 text-sm mt-8">
          Astuce : Tous les 10 clics, le multiplicateur augmente !
        </p>
      </Card>
    </div>
  );
};

export default MultiplierPains;
