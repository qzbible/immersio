import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const MotsCaches = ({ onSubmit, modeId }: { onSubmit: (answers: any) => void, modeId: string }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<number[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState(new Set<string>());
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<number[] | null>(null);

  useEffect(() => {
    fetchGameData();
  }, [modeId]);

  useEffect(() => {
    if (gameData && foundWords.length === gameData.words.length) {
      setTimeout(() => onSubmit({ words_found: foundWords.length }), 1500);
    }
  }, [foundWords, gameData, onSubmit]);

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

  const getCellsInLine = useCallback((start: number[], end: number[]) => {
    if (!start || !end) return [];
    const dr = Math.sign(end[0] - start[0]);
    const dc = Math.sign(end[1] - start[1]);
    if (dr === 0 && dc === 0) return [start];
    if (dr !== 0 && dc !== 0 && Math.abs(end[0] - start[0]) !== Math.abs(end[1] - start[1])) return [];
    
    const cells: number[][] = [];
    let r = start[0], c = start[1];
    const len = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]));
    for (let i = 0; i <= len; i++) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }
    return cells;
  }, []);

  const handleMouseDown = (row: number, col: number) => {
    setIsDragging(true);
    setStartCell([row, col]);
    setSelectedCells([[row, col]]);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isDragging || !startCell) return;
    const cells = getCellsInLine(startCell, [row, col]);
    if (cells.length > 0) setSelectedCells(cells);
  };

  const handleMouseUp = () => {
    if (!isDragging || !gameData) { setIsDragging(false); return; }
    setIsDragging(false);

    const selectedWord = selectedCells.map(([r, c]) => gameData.grid[r][c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    const match = gameData.words.find(
      (w: string) => !foundWords.includes(w) && (w === selectedWord || w === reversedWord)
    );

    if (match) {
      setFoundWords(prev => [...prev, match]);
      const newFound = new Set(foundCells);
      selectedCells.forEach(([r, c]) => newFound.add(`${r}-${c}`));
      setFoundCells(newFound);
    }
    setSelectedCells([]);
    setStartCell(null);
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">Chargement...</div>;
  }

  const isSelected = (r: number, c: number) => selectedCells.some(([sr, sc]) => sr === r && sc === c);
  const isFound = (r: number, c: number) => foundCells.has(`${r}-${c}`);

  return (
    <div className="max-w-3xl mx-auto select-none">
      <div className="mb-6 text-center">
        <span className="text-admin-yellow font-semibold text-lg">
          Mots trouvés : {foundWords.length}/{gameData.words.length}
        </span>
      </div>

      <Card className="p-4 sm:p-6 bg-white/5 backdrop-blur-md border-white/10 mb-6 ring-1 ring-white/10 shadow-2xl">
        <div
          className="grid gap-1 mx-auto"
          style={{ gridTemplateColumns: `repeat(${gameData.grid_size}, 1fr)`, maxWidth: '500px' }}
          onMouseLeave={() => { if (isDragging) handleMouseUp(); }}
        >
          {gameData.grid.map((row: string[], ri: number) =>
            row.map((letter: string, ci: number) => (
              <motion.div
                key={`${ri}-${ci}`}
                onMouseDown={() => handleMouseDown(ri, ci)}
                onMouseEnter={() => handleMouseEnter(ri, ci)}
                onMouseUp={handleMouseUp}
                onTouchStart={() => handleMouseDown(ri, ci)}
                onTouchEnd={handleMouseUp}
                whileHover={{ scale: 1.1 }}
                className={`aspect-square flex items-center justify-center text-sm sm:text-lg font-bold cursor-pointer rounded-md transition-all duration-200 shadow-sm
                  ${isFound(ri, ci) ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : isSelected(ri, ci) ? 'bg-admin-yellow text-admin-bg' 
                    : 'bg-white/5 text-white/80 hover:bg-white/15'}`}
              >
                {letter}
              </motion.div>
            ))
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 justify-center">
        {gameData.words.map((word: string) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider
              ${foundWords.includes(word)
                ? 'bg-emerald-500/20 text-emerald-400 line-through opacity-50'
                : 'bg-white/5 text-white/60 border border-white/10'}`}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

export default MotsCaches;
