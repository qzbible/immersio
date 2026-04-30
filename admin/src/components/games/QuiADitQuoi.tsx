import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const QuiADitQuoi = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [gameData, setGameData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    playClick?.();
    const updatedAnswers = { ...answers, [`q_${currentIndex}`]: answer };
    setAnswers(updatedAnswers);
    
    if (currentIndex < gameData.quotes.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 500);
    } else {
      setTimeout(() => onSubmit(updatedAnswers), 500);
    }
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  const currentQuote = gameData.quotes[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <span className="text-admin-yellow font-semibold">
          Question {currentIndex + 1}/{gameData.quotes.length}
        </span>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 mb-6 ring-1 ring-white/10 shadow-xl">
          <p className="text-2xl text-white mb-4 text-center italic font-serif">
            "{currentQuote.text}"
          </p>
          <div className="h-px bg-white/5 w-1/4 mx-auto mb-4" />
          <p className="text-admin-accent text-center text-sm font-bold uppercase tracking-widest">Qui a dit cela ?</p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuote.options.map((option: string, index: number) => (
            <Button
              key={index}
              onClick={() => handleAnswer(option)}
              variant="outline"
              className="p-8 text-lg hover:bg-admin-accent hover:border-admin-accent hover:text-white transition-all duration-300"
            >
              {option}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default QuiADitQuoi;
