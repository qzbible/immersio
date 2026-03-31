import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MotsCaches = ({ onSubmit, gameData: initialGameData, isMultiplayer }) => {
  const { t, lang } = useTranslation();
  const [gameData, setGameData] = useState(initialGameData || null);
  const [loading, setLoading] = useState(!initialGameData);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState(new Set());
  const [startCell, setStartCell] = useState(null);
  const [accumulatedPoints, setAccumulatedPoints] = useState(0);
  const isDraggingRef = useRef(false);
  const startCellRef = useRef(null);

  useEffect(() => {
    if (!initialGameData && !isMultiplayer) {
      fetchGameData();
    } else if (initialGameData) {
      setGameData(initialGameData);
      setLoading(false);
    }
  }, [initialGameData, isMultiplayer]);

  useEffect(() => {
    // We moved the end-game onSubmit trigger to handleMouseUp for better points synchronization
  }, []);

  const fetchGameData = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/games/start`,
        { mode_id: 'mots_caches', lang },
        { withCredentials: true }
      );
      setGameData(response.data.game_data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCellsInLine = useCallback((start, end) => {
    if (!start || !end) return [];
    const dr = Math.sign(end[0] - start[0]);
    const dc = Math.sign(end[1] - start[1]);
    if (dr === 0 && dc === 0) return [start];
    if (dr !== 0 && dc !== 0 && Math.abs(end[0] - start[0]) !== Math.abs(end[1] - start[1])) return [];
    
    const cells = [];
    let r = start[0], c = start[1];
    const len = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]));
    for (let i = 0; i <= len; i++) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }
    return cells;
  }, []);

  const getCellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const cell = el.closest('[data-row]');
    if (!cell) return null;
    return [parseInt(cell.dataset.row), parseInt(cell.dataset.col)];
  };

  const handlePointerDown = (e, row, col) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startCellRef.current = [row, col];
    setStartCell([row, col]);
    setSelectedCells([[row, col]]);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !startCellRef.current) return;
    e.preventDefault();
    
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    
    const cells = getCellsInLine(startCellRef.current, cell);
    if (cells.length > 0) setSelectedCells(cells);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current || !gameData) {
      isDraggingRef.current = false;
      return;
    }
    isDraggingRef.current = false;
    
    const finalCells = selectedCells;
    if (finalCells.length === 0) return;
    
    const selectedWord = finalCells.map(([r, c]) => gameData.grid[r][c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    const match = gameData.words.find(
      w => !foundWords.includes(w) && (w === selectedWord || w === reversedWord)
    );

    if (match) {
      const newFoundWords = [...foundWords, match];
      setFoundWords(newFoundWords);
      
      const newFound = new Set(foundCells);
      finalCells.forEach(([r, c]) => newFound.add(`${r}-${c}`));
      setFoundCells(newFound);
      
      const newPoints = accumulatedPoints + 100;
      setAccumulatedPoints(newPoints);
      
      if (newFoundWords.length === gameData.words.length) {
        setTimeout(() => {
          if (onSubmit) {
            if (isMultiplayer) {
              onSubmit({ words_found: newFoundWords.length }, true, newPoints);
            } else {
              onSubmit({ words_found: newFoundWords.length });
            }
          }
        }, 1500);
      }
    }
    
    setTimeout(() => {
      setSelectedCells([]);
      setStartCell(null);
    }, 300);
  };

  if (loading || !gameData) {
    return <div className="text-center text-white">{t('mots_caches.loading')}</div>;
  }

  const isSelected = (r, c) => selectedCells.some(([sr, sc]) => sr === r && sc === c);
  const isFound = (r, c) => foundCells.has(`${r}-${c}`);

  return (
    <div className="max-w-3xl mx-auto select-none" data-testid="mots-caches-game">
      <div className="mb-6 text-center">
        <span className="text-yellow-400 font-semibold text-lg">
          {t('mots_caches.words_found')} : {foundWords.length}/{gameData.words.length}
        </span>
      </div>

      <Card className="p-4 sm:p-6 bg-white/10 backdrop-blur-md border-white/20 mb-6 relative">
        <p className="text-center text-sm text-blue-200 mb-4">
          Glissez le doigt / la souris pour sélectionner un mot.
        </p>
        <div
          className="grid gap-0.5 mx-auto touch-none"
          style={{ gridTemplateColumns: `repeat(${gameData.grid_size}, 1fr)`, maxWidth: '500px' }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {gameData.grid.map((row, ri) =>
            row.map((letter, ci) => (
              <div
                key={`${ri}-${ci}`}
                data-testid={`cell-${ri}-${ci}`}
                data-row={ri}
                data-col={ci}
                onPointerDown={(e) => handlePointerDown(e, ri, ci)}
                className={`aspect-square flex items-center justify-center text-sm sm:text-base font-bold rounded-sm transition-colors select-none cursor-pointer
                  ${isFound(ri, ci) ? 'bg-emerald-500/60 text-white' 
                    : isSelected(ri, ci) ? 'bg-yellow-400/60 text-white scale-105' 
                    : 'bg-white/5 text-blue-100 hover:bg-white/15'}`}
              >
                {letter}
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 justify-center">
        {gameData.words.map((word) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${foundWords.includes(word)
                ? 'bg-emerald-500/30 text-emerald-300 line-through'
                : 'bg-white/10 text-white'}`}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

export default MotsCaches;
