import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, RotateCcw } from 'lucide-react';
// import { Button } from '@/components/ui/Button';
// import { Card } from '@/components/ui/Card';
import axios from 'axios';
// import { useAudio } from '@/hooks/useAudio';

// Import Game Components
// import VraiFaux from '@/components/games/VraiFaux';
import QuiADitQuoi from '@/components/games/QuiADitQuoi';
import ChronoVersets from '@/components/games/ChronoVersets';
import Anagrammes from '@/components/games/Anagrammes';
import MemoryBiblique from '@/components/games/MemoryBiblique';
import MotsCaches from '@/components/games/MotsCaches';
import LaManne from '@/components/games/LaManne';
import TriLivres from '@/components/games/TriLivres';
import LabyrintheExode from '@/components/games/LabyrintheExode';
import BrebisPerdue from '@/components/games/BrebisPerdue';
import MultiplierPains from '@/components/games/MultiplierPains';
import BlindTest from '@/components/games/BlindTest';
import VoyagePaul from '@/components/games/VoyagePaul';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAudio } from '@/hooks/useAudio';
import VraiFaux from '@/components/games/VraiFaux';

const CATEGORY_LABELS: Record<string, string> = {
  "quiz_vrai_faux": "Quiz Vrai/Faux",
  "quiz_qui_a_dit": "Quiz Qui a dit",
  "chrono_versets": "Complétez le verset",
  "anagrammes": "Anagrammes Bibliques",
  "labyrinthe_exode": "Labyrinthe de l'Exode",
  "blind_test": "Blind Test des Cantiques",
  "voyage_paul": "Le Voyage de Paul",
  "memory_biblique": "Memory Biblique",
  "mots_caches": "Mots Cachés",
  "la_manne": "La Manne du Ciel",
  "tri_livres": "Tri de Livres",
  "vrai_faux": "Vrai ou Faux",
  "qui_a_dit": "Qui a dit ?",
  "labyrinthe": "Labyrinthe (Exode)",
  "brebis_perdue": "Trouver la Brebis",
  "multiplier_pains": "Multiplier les Pains",
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const PlayGamePage = () => {
  const { modeId } = useParams();
  const navigate = useNavigate();
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [modeConfig, setModeConfig] = useState<any>(null);

  // Fetch mode config (including audio) on mount
  useEffect(() => {
    if (!modeId) return;
    axios.get(`${BACKEND_URL}/api/admin/game-modes/${modeId}`, { withCredentials: true })
      .then(r => setModeConfig(r.data))
      .catch(() => { }); // graceful fallback
  }, [modeId]);

  // Setup audio from mode config
  const { playSuccess, playFail, playClick, stopMusic } = useAudio({
    bg_music: modeConfig?.bg_music,
    sfx_success: modeConfig?.sfx_success,
    sfx_fail: modeConfig?.sfx_fail,
    sfx_click: modeConfig?.sfx_click,
    volume: modeConfig?.volume ?? 0.3,
  });

  const handleGameSubmit = (results: any) => {
    console.log('Game Results:', results);
    const won = results.completed !== false && (results.score ?? results.questions_correct ?? results.matches ?? 1) > 0;
    if (won) playSuccess(); else playFail();
    stopMusic();
    setGameResult(results);
    setGameOver(true);
  };

  const renderGame = () => {
    const effectiveModeId = modeConfig?.forked_from || modeId;

    switch (effectiveModeId) {
      case 'quiz_vrai_faux':
      case 'vrai_faux':
        return <VraiFaux onSubmit={handleGameSubmit} modeId={modeId || 'quiz_vrai_faux'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'quiz_qui_a_dit':
      case 'qui_a_dit':
        return <QuiADitQuoi onSubmit={handleGameSubmit} modeId={modeId || 'quiz_qui_a_dit'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'chrono_versets':
        return <ChronoVersets onSubmit={handleGameSubmit} modeId={modeId || 'chrono_versets'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'anagrammes':
        return <Anagrammes onSubmit={handleGameSubmit} modeId={modeId || 'anagrammes'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'memory_biblique':
        return <MemoryBiblique onSubmit={handleGameSubmit} modeId={modeId || 'memory_biblique'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'mots_caches':
        return <MotsCaches onSubmit={handleGameSubmit} modeId={modeId || 'mots_caches'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'la_manne':
        return <LaManne onSubmit={handleGameSubmit} modeId={modeId || 'la_manne'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'tri_livres':
        return <TriLivres onSubmit={handleGameSubmit} modeId={modeId || 'tri_livres'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'labyrinthe_exode':
      case 'labyrinthe':
        return <LabyrintheExode onSubmit={handleGameSubmit} modeId={modeId || 'labyrinthe_exode'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'brebis_perdue':
        return <BrebisPerdue onSubmit={handleGameSubmit} modeId={modeId || 'brebis_perdue'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'multiplier_pains':
        return <MultiplierPains onSubmit={handleGameSubmit} modeId={modeId || 'multiplier_pains'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'blind_test':
        return <BlindTest onSubmit={handleGameSubmit} modeId={modeId || 'blind_test'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      case 'voyage_paul':
        return <VoyagePaul onSubmit={handleGameSubmit} modeId={modeId || 'voyage_paul'} playSuccess={playSuccess} playFail={playFail} playClick={playClick} />;
      default:
        return (
          <div className="text-center p-12">
            <p className="text-white/40 text-xl mb-6">Ce mode de jeu n'est pas encore porté nativement dans l'admin.</p>
            <Button onClick={() => navigate('/games')} variant="outline">
              Retour aux modes
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-admin-bg animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-admin-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/games')}
            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all ring-1 ring-white/5"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-admin-accent/20 rounded-xl text-admin-accent shadow-lg shadow-admin-accent/10">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight uppercase tracking-tight">
                {CATEGORY_LABELS[modeId || ''] || modeId?.replace(/_/g, ' ')}
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Session de Test Administrateur</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:flex px-3 py-1.5 rounded-full bg-admin-yellow/10 text-admin-yellow text-[10px] font-black border border-admin-yellow/20 uppercase tracking-widest">
            Mode Natif
          </span>
          {gameOver && (
            <Button
              onClick={() => { setGameOver(false); setGameResult(null); }}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <RotateCcw size={14} /> Rejouer
            </Button>
          )}
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-admin-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full relative z-10">
          {!gameOver ? (
            renderGame()
          ) : (
            <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-300">
              <Card className="p-12 text-center bg-white/5 border-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-xl rounded-3xl">
                <div className="w-24 h-24 bg-admin-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-admin-accent/30">
                  <Gamepad2 size={48} className="text-admin-accent" />
                </div>
                <h3 className="text-4xl font-black text-white mb-4">Test Terminé !</h3>
                <p className="text-white/40 mb-10 text-lg leading-relaxed">
                  Le jeu fonctionne correctement avec les données actuelles de la base de données.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => navigate('/games')}
                    variant="outline"
                    className="py-8 font-bold text-lg rounded-2xl"
                  >
                    Quitter
                  </Button>
                  <Button
                    onClick={() => { setGameOver(false); setGameResult(null); }}
                    className="py-8 font-bold text-lg rounded-2xl shadow-xl shadow-admin-accent/20"
                  >
                    Rejouer
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayGamePage;
