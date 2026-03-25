import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const Anagrammes = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
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

  const handleNext = () => {
    const newAnswers = { ...answers, [`q_${currentIndex}`]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer('');
    
    if (currentIndex < gameData.anagrams.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  const currentAnagram = gameData.anagrams[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <span className="text-admin-yellow font-semibold">
          {currentIndex + 1}/{gameData.anagrams.length}
        </span>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 mb-6 text-center shadow-xl ring-1 ring-white/10">
          <p className="text-sm text-admin-accent mb-4 uppercase tracking-widest font-bold">Reconstituez le nom du personnage</p>
          <p className="text-5xl font-bold text-admin-yellow tracking-[0.2em] mb-4 drop-shadow-lg">
            {currentAnagram.scrambled}
          </p>
        </Card>

        <div className="space-y-4">
          <Input
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value.toUpperCase())}
            placeholder="Votre réponse..."
            className="text-2xl p-8 bg-white/5 border-white/10 text-white placeholder:text-white/20 text-center uppercase tracking-widest focus:border-admin-accent"
            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
            autoFocus
          />
          <Button
            onClick={handleNext}
            className="w-full py-8 text-xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 shadow-lg shadow-pink-500/20"
          >
            Valider
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Anagrammes;
