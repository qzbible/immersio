import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Check, X } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const VraiFaux = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
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

  const handleAnswer = (answer: boolean) => {
    const updatedAnswers = { ...answers, [`q_${currentIndex}`]: answer };
    setAnswers(updatedAnswers);
    
    if (currentIndex < gameData.statements.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 400);
    } else {
      setTimeout(() => onSubmit(updatedAnswers), 400);
    }
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  const currentStatement = gameData.statements[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <span className="text-admin-yellow font-semibold">
          {currentIndex + 1}/{gameData.statements.length}
        </span>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 mb-8 text-center ring-1 ring-white/10">
          <p className="text-2xl text-white font-medium">
            {currentStatement.text}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Button
            onClick={() => handleAnswer(true)}
            size="lg"
            className="p-8 bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white text-xl border-none shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-8 h-8 mr-2" />
            VRAI
          </Button>
          <Button
            onClick={() => handleAnswer(false)}
            size="lg"
            className="p-8 bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white text-xl border-none shadow-lg shadow-red-500/20"
          >
            <X className="w-8 h-8 mr-2" />
            FAUX
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default VraiFaux;
