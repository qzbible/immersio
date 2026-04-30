import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Map, Flag, Compass } from 'lucide-react';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const VoyagePaul = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [gameData, setGameData] = useState<any>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hybrid states
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

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
      if (response.data.game_data.questions) {
        setQuestionsPool(response.data.game_data.questions);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (isPaused) return;
    
    // Trigger hybrid question between stops
    if (questionsPool.length > 0) {
      triggerQuestion();
    } else {
      advanceVoyage();
    }
  };

  const triggerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    setCurrentQuestion(questionsPool[randomIndex]);
    setIsPaused(true);
  };

  const handleHybridAnswer = (correct: boolean) => {
    if (correct) setScore(prev => prev + 10);
    setCurrentQuestion(null);
    setIsPaused(false);
    advanceVoyage();
  };

  const advanceVoyage = () => {
    if (currentStopIndex < gameData.stops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    } else {
      onSubmit({ completed: true, score });
    }
  };

  if (loading || !gameData) return <div className="text-center text-white p-12 italic">Préparation du navire...</div>;

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="mb-8 text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Compass className="text-admin-accent animate-spin-slow" size={32} />
          <h2 className="text-4xl font-black italic tracking-tighter">LE VOYAGE DE PAUL</h2>
        </div>
        <p className="opacity-60 font-medium">Suivez les étapes du voyage missionnaire de l'apôtre Paul.</p>
        <p className="text-admin-yellow font-bold mt-2">Score de foi: {score}</p>
      </div>

      <div className={`relative mb-12 flex justify-between px-4 transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 -z-10 rounded-full" />
        {gameData.stops.map((stop: string, idx: number) => (
          <div key={idx} className="flex flex-col items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              idx <= currentStopIndex ? 'bg-admin-accent border-admin-accent shadow-lg shadow-admin-accent/30' : 'bg-admin-card border-white/20'
            }`}>
              {idx < currentStopIndex ? <Flag size={18} className="text-white" /> : <span className="text-xs font-bold text-white">{idx + 1}</span>}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${idx <= currentStopIndex ? 'text-white' : 'text-white/20'}`}>
              {stop}
            </span>
          </div>
        ))}
      </div>

      <Card className={`p-10 bg-white/5 border-white/10 backdrop-blur-2xl rounded-3xl relative overflow-hidden group transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Map size={120} />
        </div>
        
        <div className="text-center relative z-10">
          <p className="text-admin-yellow text-xs font-bold tracking-[0.3em] mb-4 uppercase">Étape Actuelle</p>
          <h3 className="text-6xl font-black text-white mb-8 transition-transform group-hover:scale-105 duration-500">
            {gameData.stops[currentStopIndex]}
          </h3>
          
          <Button 
            onClick={handleNext}
            size="lg"
            className="w-full h-20 text-xl font-bold bg-admin-accent hover:bg-admin-accent/80 shadow-2xl shadow-admin-accent/40 rounded-2xl group/btn"
          >
            {currentStopIndex === gameData.stops.length - 1 ? 'Terminer le Voyage' : 'Continuer vers l\'Étape Suivante'}
            <Flag className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
      
      <p className="text-center text-white/20 mt-8 text-xs font-medium uppercase tracking-[0.2em]">Traversez la mer Méditerranée et répandez la parole.</p>

      <AnimatePresence>
        {currentQuestion && (
          <GameQuestionOverlay 
            question={currentQuestion} 
            onAnswer={handleHybridAnswer} 
            playSuccess={playSuccess}
            playFail={playFail}
            playClick={playClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoyagePaul;
