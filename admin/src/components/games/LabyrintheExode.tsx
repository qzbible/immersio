import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const LabyrintheExode = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playerPos, setPlayerPos] = useState<[number, number] | null>(null);
  const [path, setPath] = useState(new Set<string>());
  const [timeLeft, setTimeLeft] = useState(90);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [steps, setSteps] = useState(0);

  // Hybrid states
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);

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
      const data = response.data.game_data;
      setGameData(data);
      setPlayerPos(data.start);
      setPath(new Set([`${data.start[0]}-${data.start[1]}`]));
      
      if (data.questions) {
        setQuestionsPool(data.questions);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gameData || completed || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameData, completed, isPaused]);

  const handleFinish = useCallback((won: boolean) => {
    if (completed) return;
    setCompleted(true);
    const timeBonus = Math.floor(timeLeft / 15);
    setTimeout(() => {
      onSubmit({ completed: won, questions_correct: questionsCorrect, time_bonus: won ? timeBonus : 0, steps });
    }, 1000);
  }, [completed, timeLeft, questionsCorrect, steps, onSubmit]);

  useEffect(() => {
    if (!gameData || !playerPos) return;
    const [px, py] = playerPos;
    const [ex, ey] = gameData.end;
    if (px === ex && py === ey) {
      handleFinish(true);
    }
    
    // Trigger question every 10 steps
    if (steps > 0 && steps % 10 === 0 && !isPaused && questionsPool.length > 0) {
        triggerQuestion();
    }
  }, [playerPos, gameData, steps, isPaused, questionsPool, handleFinish]);

  const triggerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    setCurrentQuestion(questionsPool[randomIndex]);
    setIsPaused(true);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) setQuestionsCorrect(prev => prev + 1);
    setCurrentQuestion(null);
    setIsPaused(false);
  };

  const move = useCallback((dx: number, dy: number) => {
    if (!gameData || completed || isPaused) return;
    const [px, py] = playerPos!;
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || nx >= gameData.width || ny < 0 || ny >= gameData.height) return;
    if (gameData.maze[ny][nx] === 1) return;
    setPlayerPos([nx, ny]);
    setPath(prev => new Set([...prev, `${nx}-${ny}`]));
    setSteps(s => s + 1);
  }, [gameData, playerPos, completed, isPaused]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const moves: { [key: string]: [number, number] } = { 
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
      };
      if (moves[e.key]) { 
        e.preventDefault(); 
        move(...moves[e.key]); 
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  if (loading || !gameData) {
    return <div className="text-center text-white p-12">Préparation de l'Exode...</div>;
  }

  if (completed) {
    const won = playerPos![0] === gameData.end[0] && playerPos![1] === gameData.end[1];
    return (
      <div className="max-w-md mx-auto text-center">
        <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20">
          <div className="text-6xl mb-4">{won ? '🏆' : '⏰'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {won ? 'Terre Promise Atteinte !' : 'Temps Épuisé...'}
          </h2>
          <p className="text-blue-200 mb-2">Pas effectués : {steps} | Questions Correctes : {questionsCorrect}</p>
          <p className="text-admin-yellow font-bold">Temps restant : {timeLeft}s</p>
        </Card>
      </div>
    );
  }

  const viewSize = 9;
  const half = Math.floor(viewSize / 2);
  const [vpx, vpy] = playerPos!;
  const startX = Math.max(0, Math.min(vpx - half, gameData.width - viewSize));
  const startY = Math.max(0, Math.min(vpy - half, gameData.height - viewSize));

  return (
    <div className="max-w-xl mx-auto relative">
      <div className="flex items-center justify-between mb-4 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Pas effectuées</span>
            <span className="text-white font-bold">{steps}</span>
        </div>
        <div className="flex flex-col items-center">
             <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Temps restant</span>
             <span className={`font-black text-2xl ${timeLeft <= 15 ? 'text-red-500 animate-pulse' : 'text-admin-yellow'}`}>
                {timeLeft}s
            </span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Questions</span>
            <span className="text-emerald-400 font-bold">{questionsCorrect}</span>
        </div>
      </div>

      <Card className={`p-2 bg-slate-900 border-white/10 mb-6 shadow-2xl relative transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${viewSize}, 1fr)`, maxWidth: '100%' }}>
          {Array.from({ length: viewSize }, (_, vy) =>
            Array.from({ length: viewSize }, (_, vx) => {
              const mx = startX + vx;
              const my = startY + vy;
              const isPlayer = mx === vpx && my === vpy;
              const isEnd = mx === gameData.end[0] && my === gameData.end[1];
              const isStart = mx === gameData.start[0] && my === gameData.start[1];
              const isWall = gameData.maze[my]?.[mx] === 1;
              const isPath = path.has(`${mx}-${my}`);

              return (
                <div
                  key={`${mx}-${my}`}
                  onClick={() => {
                    const dx = mx - vpx;
                    const dy = my - vpy;
                    if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy);
                  }}
                  className={`aspect-square rounded flex items-center justify-center text-xl cursor-pointer transition-all duration-200
                    ${isPlayer ? 'bg-admin-yellow text-slate-900 shadow-lg shadow-admin-yellow/20 z-10 scale-110'
                    : isEnd ? 'bg-emerald-500/40 animate-pulse'
                    : isStart ? 'bg-blue-500/20'
                    : isWall ? 'bg-white/5'
                    : isPath ? 'bg-admin-accent/20'
                    : 'bg-transparent'}`}
                >
                  {isPlayer ? '🚶' : isEnd ? '⛪' : isStart ? '🏛️' : ''}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className={`grid grid-cols-3 gap-3 max-w-[200px] mx-auto transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        <div />
        <Button onClick={() => move(0, -1)} variant="outline" className="w-14 h-14 p-0">↑</Button>
        <div />
        <Button onClick={() => move(-1, 0)} variant="outline" className="w-14 h-14 p-0">←</Button>
        <Button onClick={() => move(0, 1)} variant="outline" className="w-14 h-14 p-0">↓</Button>
        <Button onClick={() => move(1, 0)} variant="outline" className="w-14 h-14 p-0">→</Button>
      </div>

      <p className="text-center text-white/30 text-xs mt-6 font-medium">
        Utilisez les flèches ou ZQSD pour vous déplacer.
      </p>

      <AnimatePresence>
        {currentQuestion && (
          <GameQuestionOverlay 
            question={currentQuestion} 
            onAnswer={handleAnswer} 
            playSuccess={playSuccess}
            playFail={playFail}
            playClick={playClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabyrintheExode;
