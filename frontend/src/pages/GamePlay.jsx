import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import axios from 'axios';
import { useTranslation } from '@/hooks/useTranslation';
import { useAudio } from '@/hooks/useAudio';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trophy, ShieldAlert, Target, Star, Zap, Flame, Crown } from 'lucide-react';

const DIFFICULTIES = [
  { value: "très faible", label: "Très faible", icon: <ShieldAlert className="w-6 h-6" />, color: "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20" },
  { value: "faible", label: "Faible", icon: <Target className="w-6 h-6" />, color: "border-blue-500/30 text-blue-300 hover:bg-blue-500/20" },
  { value: "moyen", label: "Moyen", icon: <Star className="w-6 h-6" />, color: "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20" },
  { value: "un peu audessus de la moyen", label: "Supérieur", icon: <Zap className="w-6 h-6" />, color: "border-orange-500/30 text-orange-300 hover:bg-orange-500/20" },
  { value: "fort", label: "Fort", icon: <Flame className="w-6 h-6" />, color: "border-red-500/30 text-red-300 hover:bg-red-500/20" },
  { value: "tres fort", label: "Très fort", icon: <Crown className="w-6 h-6" />, color: "border-purple-500/30 text-purple-300 hover:bg-purple-500/20" },
];

import QuiADitQuoi from '@/components/games/QuiADitQuoi';
import VraiFaux from '@/components/games/VraiFaux';
import ChronoVersets from '@/components/games/ChronoVersets';
import MotsCaches from '@/components/games/MotsCaches';
import Anagrammes from '@/components/games/Anagrammes';
import MemoryBiblique from '@/components/games/MemoryBiblique';
import LaManne from '@/components/games/LaManne';
import TriLivres from '@/components/games/TriLivres';
import BrebisPerdue from '@/components/games/BrebisPerdue';
import MultiplierPains from '@/components/games/MultiplierPains';
import LabyrintheExode from '@/components/games/LabyrintheExode';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GamePlay = () => {
  const navigate = useNavigate();
  const { modeId } = useParams();
  const { t, lang } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Audio from game mode config (populated once gameMode is fetched)
  const { playSuccess, playFail, stopMusic } = useAudio({
    bg_music:    gameMode?.bg_music,
    sfx_success: gameMode?.sfx_success,
    sfx_fail:    gameMode?.sfx_fail,
    sfx_click:   gameMode?.sfx_click,
    volume:      gameMode?.volume ?? 0.3,
  });

  useEffect(() => {
    // Only fetch if a difficulty is selected, or we can fetch mode info prior.
    // For now, startGame will fetch everything.
  }, [modeId]);

  const handleDifficultySelect = (diff) => {
    setSelectedDifficulty(diff.value);
    startGame(diff.value);
  };

  const startGame = async (difficultyValue) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/games/start`,
        { mode_id: modeId, lang, difficulty: difficultyValue },
        { withCredentials: true }
      );
      
      setGameSession(response.data.session_id);
      setGameMode(response.data.mode);
      setLoading(false);
    } catch (error) {
      console.error('Erreur démarrage jeu:', error);
      alert('Erreur lors du démarrage du jeu');
      navigate('/games');
    }
  };

  const handleSubmit = async (answers) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/games/submit`,
        {
          session_id: gameSession,
          answers: answers
        },
        { withCredentials: true }
      );
      
      const data = response.data;
      setResult(data);
      stopMusic();
      
      if (data.score >= 3) {
        setShowConfetti(true);
        playSuccess();
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        playFail();
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de la soumission');
    }
  };

  const getGameComponent = () => {
    const gameComponents = {
      'quiz_qui_a_dit': QuiADitQuoi,
      'quiz_vrai_faux': VraiFaux,
      'chrono_versets': ChronoVersets,
      'mots_caches': MotsCaches,
      'anagrammes': Anagrammes,
      'memory_biblique': MemoryBiblique,
      'la_manne': LaManne,
      'tri_livres': TriLivres,
      'brebis_perdue': BrebisPerdue,
      'multiplier_pains': MultiplierPains,
      'labyrinthe_exode': LabyrintheExode
    };

    const GameComponent = gameComponents[modeId];
    
    if (!GameComponent) {
      return (
        <div className="text-center py-12">
          <p className="text-white text-lg">{t('games.not_implemented')}</p>
          <Button onClick={() => navigate('/games')} className="mt-4">
            {t('games.back_to_modes')}
          </Button>
        </div>
      );
    }

    return <GameComponent onSubmit={handleSubmit} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('games.loading_game')}</p>
        </div>
      </div>
    );
  }

  if (!selectedDifficulty && !loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full max-w-4xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Niveau de Difficulté
          </h1>
          <p className="text-blue-200 text-lg mb-12">Choisissez la difficulté pour cette session</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => handleDifficultySelect(d)}
                className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95 bg-white/5 ${d.color}`}
              >
                <div className="mb-3">{d.icon}</div>
                <span className="font-bold">{d.label}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={() => navigate('/games')}
            variant="outline"
            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux modes
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20 text-center">
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              result.score >= 3 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-orange-400 to-orange-600'
            }`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
              {result.score >= 3 ? t('games.excellent') : t('games.well_played')}
            </h2>
            
            <div className="mb-8">
              <div data-testid="game-score" className="text-6xl font-bold text-yellow-400 mb-2">
                {result.score}
              </div>
              <div className="text-blue-200">{t('games.points_scored')}</div>
              <div className="text-sm text-blue-300 mt-2">
                +{result.xp_gained} XP • +{result.coins_earned} 🪙
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {t('games.replay')}
              </Button>
              <Button
                onClick={() => navigate('/games')}
                variant="outline"
                className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
              >
                {t('games.other_modes')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button
          onClick={() => { stopMusic(); navigate('/games'); }}
          variant="outline"
          className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quitter
        </Button>

        {gameMode && (
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
              {gameMode.name}
            </h1>
            <p className="text-blue-200 text-sm">{gameMode.description}</p>
          </div>
        )}

        {getGameComponent()}
      </div>
    </div>
  );
};

export default GamePlay;
