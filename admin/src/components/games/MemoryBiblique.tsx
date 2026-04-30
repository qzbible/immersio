import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import GameQuestionOverlay from './GameQuestionOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const MemoryBiblique = ({ onSubmit, modeId, playSuccess, playFail, playClick }: { 
  onSubmit: (answers: any) => void, 
  modeId: string,
  playSuccess?: () => void,
  playFail?: () => void,
  playClick?: () => void
}) => {
  const [gameData, setGameData] = useState<any>(null);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [moves, setMoves] = useState(0);

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

  useEffect(() => {
    if (flippedCards.length === 2) {
      checkMatch();
    }
  }, [flippedCards]);

  useEffect(() => {
    if (gameData && matchedCards.length === gameData.cards.length) {
      setTimeout(() => {
        onSubmit({ matches: matchedCards.length / 2 });
      }, 1000);
    }

    // Trigger question every 3 pairs (6 cards matched)
    const pairsFound = matchedCards.length / 2;
    if (pairsFound > 0 && pairsFound % 3 === 0 && questionsPool.length > 0) {
      triggerQuestion();
    }
  }, [matchedCards, gameData]);

  const triggerQuestion = () => {
    if (currentQuestion || isPaused) return;
    const randomIndex = Math.floor(Math.random() * questionsPool.length);
    setCurrentQuestion(questionsPool[randomIndex]);
    setIsPaused(true);
  };

  const handleAnswer = (correct: boolean) => {
    setCurrentQuestion(null);
    setIsPaused(false);
  };

  const handleCardClick = (index: number) => {
    if (isPaused || flippedCards.length === 2 || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }
    setFlippedCards([...flippedCards, index]);
    setMoves(moves + 1);
  };

  const checkMatch = () => {
    const [first, second] = flippedCards;
    const card1 = gameData.cards[first];
    const card2 = gameData.cards[second];

    if (card1.symbol === card2.symbol) {
      setMatchedCards([...matchedCards, first, second]);
      setFlippedCards([]);
    } else {
      setTimeout(() => {
        setFlippedCards([]);
      }, 1000);
    }
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="mb-6 text-center">
        <span className="text-admin-yellow font-semibold text-lg">
          Coups : {moves} | Paires trouvées : {matchedCards.length / 2}/{gameData.cards.length / 2}
        </span>
      </div>

      <div className={`grid grid-cols-4 gap-4 transition-opacity ${isPaused ? 'opacity-20 pointer-events-none' : ''}`}>
        {gameData.cards.map((card: any, index: number) => {
          const isFlipped = flippedCards.includes(index) || matchedCards.includes(index);
          const isMatched = matchedCards.includes(index);
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: isPaused ? 1 : 1.05 }}
              whileTap={{ scale: isPaused ? 1 : 0.95 }}
            >
              <Card
                onClick={() => handleCardClick(index)}
                className={`aspect-square flex items-center justify-center text-5xl cursor-pointer transition-all duration-300 shadow-lg ring-1 ring-white/10 ${
                  isFlipped
                    ? 'bg-white/10 backdrop-blur-md border-admin-accent/50 rotate-y-180'
                    : 'bg-gradient-to-br from-admin-accent to-admin-accent/60 hover:from-admin-accent hover:to-admin-accent/80'
                } ${isMatched ? 'opacity-50 border-emerald-500/50' : ''}`}
              >
                {isFlipped ? card.symbol : '?'}
              </Card>
            </motion.div>
          );
        })}
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

export default MemoryBiblique;
