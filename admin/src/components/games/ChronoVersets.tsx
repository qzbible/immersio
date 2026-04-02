import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import axios from 'axios';
import { Timer } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const ChronoVersets = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [gameData, setGameData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameData();
  }, [modeId]);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleNext();
    }
  }, [timeLeft, loading]);

  const fetchGameData = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/games/start`,
        { mode_id: modeId },
        { withCredentials: true }
      );
      setGameData(response.data.game_data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    playClick?.();
    const newAnswers = { ...answers, [`q_${currentIndex}`]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setTimeLeft(30);
    
    if (currentIndex < gameData.verses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  const currentVerse = gameData.verses[currentIndex];
  const displayText = currentVerse.text.replace(currentVerse.missing, '______');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-admin-yellow font-semibold">
          Verset {currentIndex + 1}/{gameData.verses.length}
        </span>
        <div className="flex items-center gap-2 text-white">
          <Timer className="w-5 h-5 text-admin-accent" />
          <span className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 mb-6 ring-1 ring-white/10">
        <p className="text-2xl text-white mb-4 text-center font-serif leading-relaxed">
          {displayText}
        </p>
        <div className="h-px bg-white/5 w-1/4 mx-auto mb-4" />
        <p className="text-admin-accent text-center text-sm font-bold">{currentVerse.reference}</p>
      </Card>

      <div className="space-y-4">
        <Input
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="Complétez le verset..."
          className="text-lg p-8 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-admin-accent"
          onKeyPress={(e) => e.key === 'Enter' && handleNext()}
          autoFocus
        />
        <Button
          onClick={handleNext}
          className="w-full py-8 text-lg font-bold shadow-lg shadow-admin-accent/20"
        >
          Valider
        </Button>
      </div>
    </div>
  );
};

export default ChronoVersets;
