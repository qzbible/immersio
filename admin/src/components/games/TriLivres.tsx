import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const TriLivres = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [books] = useState([
    { name: 'Genèse', testament: 'Ancien' },
    { name: 'Exode', testament: 'Ancien' },
    { name: 'Matthieu', testament: 'Nouveau' },
    { name: 'Jean', testament: 'Nouveau' },
    { name: 'Romains', testament: 'Nouveau' },
    { name: 'Psaumes', testament: 'Ancien' },
    { name: 'Apocalypse', testament: 'Nouveau' },
    { name: 'Lévitique', testament: 'Ancien' }
  ]);
  
  const [shuffledBooks, setShuffledBooks] = useState(() => 
    [...books].sort(() => Math.random() - 0.5)
  );
  
  const [ancien, setAncien] = useState<any[]>([]);
  const [nouveau, setNouveau] = useState<any[]>([]);
  const [draggedBook, setDraggedBook] = useState<any>(null);

  // Hybrid states
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSorted, setTotalSorted] = useState(0);

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
      if (response.data.game_data.questions) {
        setQuestionsPool(response.data.game_data.questions);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDragStart = (book: any) => {
    if (isPaused) return;
    setDraggedBook(book);
  };

  const handleDrop = (testament: string) => {
    if (!draggedBook || isPaused) return;

    if (testament === 'Ancien') {
      setAncien([...ancien, draggedBook]);
    } else {
      setNouveau([...nouveau, draggedBook]);
    }

    const newTotalSorted = totalSorted + 1;
    setTotalSorted(newTotalSorted);

    const remaining = shuffledBooks.filter(b => b !== draggedBook);
    setShuffledBooks(remaining);
    
    const currentDragged = draggedBook;
    setDraggedBook(null);

    // Trigger question every 5 books
    if (newTotalSorted > 0 && newTotalSorted % 5 === 0 && questionsPool.length > 0) {
      triggerQuestion();
    }

    if (remaining.length === 0) {
      setTimeout(() => {
        const finalAncien = testament === 'Ancien' ? [...ancien, currentDragged] : ancien;
        const finalNouveau = testament === 'Nouveau' ? [...nouveau, currentDragged] : nouveau;
        
        const correctAncien = finalAncien.filter(b => b.testament === 'Ancien').length;
        const correctNouveau = finalNouveau.filter(b => b.testament === 'Nouveau').length;
        
        onSubmit({ matches: correctAncien + correctNouveau });
      }, 500);
    }
  };

  const triggerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    setCurrentQuestion(questionsPool[randomIndex]);
    setIsPaused(true);
  };

  const handleAnswer = (correct: boolean) => {
    setCurrentQuestion(null);
    setIsPaused(false);
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="mb-8">
        <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Tri de Livres</h2>
            <p className="text-white/40">Glissez chaque livre dans le bon testament</p>
        </div>
        
        <div className={`flex flex-wrap gap-3 justify-center min-h-[100px] p-6 rounded-2xl bg-white/5 border border-white/5 shadow-inner transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
          {shuffledBooks.map((book, idx) => (
            <div
              key={idx}
              draggable={!isPaused}
              onDragStart={() => handleDragStart(book)}
              className="px-6 py-3 bg-admin-accent text-white font-bold rounded-xl cursor-move hover:scale-105 active:scale-95 transition-all shadow-lg shadow-admin-accent/20"
            >
              {book.name}
            </div>
          ))}
          {shuffledBooks.length === 0 && (
              <span className="text-white/20 italic self-center">Tous les livres sont triés !</span>
          )}
        </div>
      </div>

      <div className={`grid md:grid-cols-2 gap-8 transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        <Card
          onDragOver={(e: any) => e.preventDefault()}
          onDrop={() => handleDrop('Ancien')}
          className="p-8 bg-white/5 backdrop-blur-md border-white/10 min-h-[250px] flex flex-col rounded-3xl"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-admin-yellow animate-pulse" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                Ancien Testament
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {ancien.map((book, idx) => (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  book.testament === 'Ancien'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/20 text-red-400 border border-red-500/20'
                }`}
              >
                {book.name}
              </div>
            ))}
          </div>
        </Card>

        <Card
          onDragOver={(e: any) => e.preventDefault()}
          onDrop={() => handleDrop('Nouveau')}
          className="p-8 bg-white/5 backdrop-blur-md border-white/10 min-h-[250px] flex flex-col rounded-3xl"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-admin-accent animate-pulse" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                Nouveau Testament
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {nouveau.map((book, idx) => (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  book.testament === 'Nouveau'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/20 text-red-400 border border-red-500/20'
                }`}
              >
                {book.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

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

export default TriLivres;
