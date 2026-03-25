import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Music, Play, CheckCircle2, XCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const BlindTest = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

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

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === gameData.tracks[currentIndex].answer;
    if (isCorrect) setScore(score + 1);

    setTimeout(() => {
      if (currentIndex < gameData.tracks.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
      } else {
        onSubmit({ score: score + (isCorrect ? 1 : 0) });
      }
    }, 1500);
  };

  if (loading || !gameData) return <div className="text-center text-white p-12 italic">Chargement des cantiques...</div>;

  const currentTrack = gameData.tracks[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-white mb-2">Blind Test des Cantiques</h2>
        <p className="text-admin-accent font-bold">Question {currentIndex + 1} / {gameData.tracks.length}</p>
      </div>

      <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-xl mb-8 flex flex-col items-center gap-6 rounded-3xl">
        <div className="w-24 h-24 bg-admin-accent/20 rounded-full flex items-center justify-center animate-pulse">
          <Music size={48} className="text-admin-accent" />
        </div>
        <Button size="lg" className="rounded-full w-16 h-16 p-0 bg-admin-accent hover:scale-110 transition-transform">
          <Play size={32} />
        </Button>
        <p className="text-white/40 text-sm font-medium">ÉCOUTEZ LE CANTIQUE...</p>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {currentTrack.options.map((option: string, idx: number) => {
          const isCorrect = idx === currentTrack.answer;
          const isSelected = selected === idx;
          
          let variant = "outline" as any;
          if (selected !== null) {
            if (isCorrect) variant = "default";
            else if (isSelected) variant = "destructive";
          }

          return (
            <Button
              key={idx}
              onClick={() => handleAnswer(idx)}
              variant={variant}
              className={`p-6 text-lg justify-between transition-all rounded-2xl ${
                selected !== null && isCorrect ? 'bg-emerald-500 border-emerald-500' : ''
              }`}
            >
              {option}
              {selected !== null && (
                isCorrect ? <CheckCircle2 size={20} /> : isSelected ? <XCircle size={20} /> : null
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BlindTest;
