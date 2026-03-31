import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ArrowRight, CheckCircle2 } from 'lucide-react';

const TriLivres = ({ onSubmit, isMultiplayer, gameData }) => {
  // Use books from gameData if provided, fallback to default list
  const initialBooks = gameData?.books || [
    { name: 'Genèse', testament: 'Ancien' },
    { name: 'Exode', testament: 'Ancien' },
    { name: 'Matthieu', testament: 'Nouveau' },
    { name: 'Jean', testament: 'Nouveau' },
    { name: 'Romains', testament: 'Nouveau' },
    { name: 'Psaumes', testament: 'Ancien' },
    { name: 'Apocalypse', testament: 'Nouveau' },
    { name: 'Lévitique', testament: 'Ancien' }
  ];

  const [shuffledBooks, setShuffledBooks] = useState([]);
  const [ancien, setAncien] = useState([]);
  const [nouveau, setNouveau] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [completed, setCompleted] = useState(false);

  // Initialize shuffled books on mount
  useEffect(() => {
    setShuffledBooks([...initialBooks].sort(() => Math.random() - 0.5));
  }, []);

  // Handle book selection
  const handleBookClick = (e, book) => {
    e.stopPropagation(); // Prevent card clicks if this is nested (though it's not)
    if (selectedBook?.name === book.name) {
      setSelectedBook(null);
    } else {
      setSelectedBook(book);
    }
  };

  // Handle destination click
  const handleContainerClick = (testament) => {
    if (!selectedBook) return;

    if (testament === 'Ancien') {
      setAncien(prev => [...prev, selectedBook]);
    } else {
      setNouveau(prev => [...prev, selectedBook]);
    }

    setShuffledBooks(prev => prev.filter(b => b.name !== selectedBook.name));
    setSelectedBook(null);
  };

  // Check for completion
  useEffect(() => {
    if (shuffledBooks.length === 0 && (ancien.length > 0 || nouveau.length > 0) && !completed) {
      setCompleted(true);
      const correctAncien = ancien.filter(b => b.testament === 'Ancien').length;
      const correctNouveau = nouveau.filter(b => b.testament === 'Nouveau').length;
      const totalCorrect = correctAncien + correctNouveau;
      
      setTimeout(() => {
        if (onSubmit) {
          if (isMultiplayer) onSubmit(null, true, totalCorrect * 100);
          else onSubmit({ matches: totalCorrect });
        }
      }, 1000);
    }
  }, [shuffledBooks, ancien, nouveau, completed, onSubmit, isMultiplayer]);

  return (
    <div className="w-full max-w-4xl mx-auto p-2">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Tri des Livres</h2>
        <p className="text-blue-200 text-sm">
          Sélectionnez un livre puis touchez sa destination (Ancien ou Nouveau Testament)
        </p>
      </div>

      {/* Source Area */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 mb-8 border border-white/10 min-h-[120px] flex flex-wrap gap-2 justify-center items-center">
        <AnimatePresence>
          {shuffledBooks.map((book) => (
            <motion.button
              key={book.name}
              layoutId={book.name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={(e) => handleBookClick(e, book)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 ${
                selectedBook?.name === book.name
                  ? 'bg-yellow-400 text-black scale-110 ring-4 ring-yellow-400/50'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Book className="w-4 h-4" />
              {book.name}
            </motion.button>
          ))}
        </AnimatePresence>
        {shuffledBooks.length === 0 && !completed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Tri terminé !
          </motion.div>
        )}
      </div>

      {/* Destination Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ancien Testament */}
        <div
          onClick={() => handleContainerClick('Ancien')}
          className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer min-h-[180px] ${
            selectedBook 
              ? 'border-yellow-400/50 bg-yellow-400/5 hover:bg-yellow-400/10 scale-[1.02]' 
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="absolute top-4 left-4 text-white/20">
             <Trophy className="w-12 h-12 rotate-[-15deg]" />
          </div>
          <h3 className="text-lg font-black text-blue-400 mb-4 text-center uppercase tracking-widest">
            Ancien Testament
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {ancien.map((book, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  book.testament === 'Ancien'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                }`}
              >
                {book.name}
              </motion.div>
            ))}
          </div>
          {selectedBook && (
            <div className="mt-4 flex justify-center animate-pulse">
               <ArrowRight className="w-6 h-6 text-yellow-400 rotate-90 md:rotate-0" />
            </div>
          )}
        </div>

        {/* Nouveau Testament */}
        <div
          onClick={() => handleContainerClick('Nouveau')}
          className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer min-h-[180px] ${
            selectedBook 
              ? 'border-yellow-400/50 bg-yellow-400/5 hover:bg-yellow-400/10 scale-[1.02]' 
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="absolute top-4 right-4 text-white/20">
             <Trophy className="w-12 h-12 rotate-[15deg]" />
          </div>
          <h3 className="text-lg font-black text-purple-400 mb-4 text-center uppercase tracking-widest">
            Nouveau Testament
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {nouveau.map((book, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  book.testament === 'Nouveau'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                }`}
              >
                {book.name}
              </motion.div>
            ))}
          </div>
          {selectedBook && (
            <div className="mt-4 flex justify-center animate-pulse">
               <ArrowRight className="w-6 h-6 text-yellow-400 rotate-90 md:rotate-0" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Trophy and Clock icons as fallbacks or custom
const Trophy = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

export default TriLivres;
