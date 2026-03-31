import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Eye, Trophy, Zap, Heart, MessageCircle, Share2, Flame } from 'lucide-react';
import axios from 'axios';
import Anagrammes from '@/components/games/Anagrammes';
import MotsCaches from '@/components/games/MotsCaches';
import ChronoVersets from '@/components/games/ChronoVersets';
import QuiADitQuoi from '@/components/games/QuiADitQuoi';
import VraiFaux from '@/components/games/VraiFaux';
import LaManne from '@/components/games/LaManne';
import BrebisPerdue from '@/components/games/BrebisPerdue';
import LabyrintheExode from '@/components/games/LabyrintheExode';
import MemoryBiblique from '@/components/games/MemoryBiblique';
import MultiplierPains from '@/components/games/MultiplierPains';
import TriLivres from '@/components/games/TriLivres';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SpectatorMatchSlide = ({ match, isActive }) => {
  const { t } = useTranslation();
  const socketRef = useRef(null);
  const [matchData, setMatchData] = useState(match);
  const [currentQuestion, setCurrentQuestion] = useState(match.current_question || null);
  const [scores, setScores] = useState({ 
    player1: match.player1_score || 0, 
    player2: match.player2_score || 0 
  });
  const [gameState, setGameState] = useState('connecting');
  const [finalResult, setFinalResult] = useState(null);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 100));
  const [isLiked, setIsLiked] = useState(false);
  
  const [p1Status, setP1Status] = useState('⌛️');
  const [p2Status, setP2Status] = useState('⌛️');
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [p1Actions, setP1Actions] = useState([]);  
  const [p2Actions, setP2Actions] = useState([]);  
  const [currentGameType, setCurrentGameType] = useState(null);

  const GAME_LABELS = {
    mcq: '📚 Quiz',
    anagrammes: '🔤 Anagrammes',
    mots_caches: '🔍 Mots Cachés',
    qui_a_dit: '💬 Qui a dit ?',
    vrai_faux: '✅ Vrai/Faux',
    la_manne: '🍞 La Manne',
    brebis_perdue: '🐑 Brebis Perdue',
    multiplier_pains: '🍞 Multiplier Pains',
    memory_biblique: '🃏 Mémory',
    labyrinthe_exode: '🗺 Labyrinthe',
    tri_livres: '📚 Tri Livres',
  };
  const [floatingLikes, setFloatingLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  useEffect(() => {
    // Fake comments removed to favor real-time user chat
    return () => {};
  }, [gameState]);

  useEffect(() => {
    if (!isActive) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io(BACKEND_URL, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_duo_room', { match_id: match.match_id, user_id: 'spectator', role: 'spectator' });
    });

    socketRef.current.on('joined_room', () => setGameState('watching'));

    socketRef.current.on('new_question', (data) => {
      setCurrentQuestion(data);
      setGameState('watching');
      setP1Status('🧠 Réfléchit...');
      setP2Status('🧠 Réfléchit...');
      setCorrectAnswer(null);
      setCurrentGameType(data.type || 'mcq');
      setP1Actions([]);
      setP2Actions([]);
    });

    socketRef.current.on('answer_received', (data) => {
      if (data.role === 'player1') setP1Status('⚡ A répondu !');
      if (data.role === 'player2') setP2Status('⚡ A répondu !');
    });

    socketRef.current.on('spectator_action', (data) => {
      if (data.role === 'player1') setP1Status(data.text || 'Action!');
      else if (data.role === 'player2') setP2Status(data.text || 'Action!');
    });

    socketRef.current.on('round_results', (data) => {
      if (data.player1) setScores(prev => ({ ...prev, player1: data.player1.total_score }));
      if (data.player2) setScores(prev => ({ ...prev, player2: data.player2.total_score }));
      setCorrectAnswer(data.correct_answer);
    });

    socketRef.current.on('game_end', (data) => {
      setFinalResult(data);
      setGameState('finished');
    });

    socketRef.current.on('spectator_like', (data) => {
      setLikes(prev => prev + 1);
      const newHeart = { id: Date.now() + Math.random(), left: 10 + Math.random() * 20 };
      setFloatingLikes(prev => [...prev, newHeart]);
      setTimeout(() => { setFloatingLikes(prev => prev.filter(h => h.id !== newHeart.id)); }, 2000);
    });

    socketRef.current.on('spectator_comment', (data) => {
      setComments(prev => [...prev.slice(-4), data]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isActive, match.match_id]);

  const renderGameComponent = (question) => {
    if (!question) return null;
    const commonProps = { isMultiplayer: true, onSubmit: () => {} };
    switch (question.type) {
      case 'anagrammes': return <Anagrammes {...commonProps} gameData={question.gameData} />;
      case 'mots_caches': return <MotsCaches {...commonProps} />;
      case 'chrono_versets': return <ChronoVersets {...commonProps} gameData={question.gameData} />;
      case 'qui_a_dit': return <QuiADitQuoi {...commonProps} gameData={question.gameData} />;
      case 'vrai_faux': return <VraiFaux {...commonProps} gameData={question.gameData} />;
      case 'la_manne': return <LaManne {...commonProps} />;
      case 'brebis_perdue': return <BrebisPerdue {...commonProps} />;
      case 'labyrinthe_exode': return <LabyrintheExode {...commonProps} />;
      case 'memory_biblique': return <MemoryBiblique {...commonProps} gameData={question.gameData} />;
      case 'multiplier_pains': return <MultiplierPains {...commonProps} />;
      case 'tri_livres': return <TriLivres {...commonProps} gameData={question.gameData} />;
      default:
        return (
          <div className="flex flex-col gap-4 p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 w-full max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-white text-center mb-2">{question.text}</h4>
            <div className="grid grid-cols-2 gap-2">
              {question.options?.map((opt, i) => (
                <div key={i} className={`p-2 rounded-xl border text-center text-[10px] ${correctAnswer === i ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                   {opt}
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  const handleLike = () => {
    setIsLiked(true);
    setLikes(prev => prev + 1);
    const newHeart = { id: Date.now() + Math.random(), left: 10 + Math.random() * 20 };
    setFloatingLikes(prev => [...prev, newHeart]);
    setTimeout(() => { setFloatingLikes(prev => prev.filter(h => h.id !== newHeart.id)); }, 2000);
    
    // Notify others
    if (socketRef.current) {
      socketRef.current.emit('spectator_like', { match_id: match.match_id });
    }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const newComment = { 
      id: Date.now(), 
      user: 'Moi', 
      text: chatMessage.trim(),
      match_id: match.match_id 
    };
    
    // We don't update local state here because we listen to 'spectator_comment' 
    // which is broadcasted back to us too (to ensure sync)
    if (socketRef.current) {
      socketRef.current.emit('spectator_comment', newComment);
    }
    
    setChatMessage('');
    setIsChatOpen(false);
  };

  return (
    <div className="relative w-full h-screen snap-start snap-always overflow-hidden bg-black flex flex-col">
      {/* Background Visual */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen overflow-hidden">
        <div className={`absolute top-[20%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[100px] ${isActive ? 'bg-indigo-600' : 'bg-indigo-900'} transition-all`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[100px] ${isActive ? 'bg-purple-600' : 'bg-purple-900'} transition-all`}></div>
      </div>

      {/* Top HUD */}
      {(currentQuestion || gameState === 'finished') && (
        <div className="relative z-50 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 bg-red-600/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-white w-fit">
              <Eye className="w-3 h-3" /> DIRECT
            </div>
            {matchData.is_tournament && (
              <div className="flex items-center gap-1.5 bg-yellow-500/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold text-black w-fit">
                <Trophy className="w-3 h-3" /> {matchData.tournament_name || 'TOURNOI'}
              </div>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/20 text-white">
            {gameState === 'finished' ? 'TERMINE' : currentQuestion ? `QUESTION ${currentQuestion.question_index + 1}` : 'ATTENTE'}
          </div>
        </div>
      )}

      {/* Split Area */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'finished' && finalResult ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-2xl font-black text-white">{finalResult.winner === 'draw' ? 'MATCH NUL' : `${finalResult.winner === 'player1' ? matchData.player1_name : matchData.player2_name} GAGNE!`}</h2>
            </motion.div>
          ) : currentQuestion ? (
            <div className="flex-1 flex flex-col w-full h-full">
              
              {/* Player 1 - Top */}
              <div className="flex-1 relative border-b border-white/5 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute top-2 left-2 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                  <img src={matchData.player1_picture || '/default_avatar.png'} alt="P1" className="w-8 h-8 rounded-full border border-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-[10px]">{matchData.player1_name || 'Joueur 1'}</span>
                    <span className="text-blue-400 font-bold text-[10px]">{scores.player1} pts</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 z-40 bg-black/40 px-2 py-1 rounded-lg">
                   <p className="text-emerald-400 font-bold text-[8px] uppercase">{p1Status}</p>
                </div>
                <div className="w-full scale-[0.6] origin-center pointer-events-none opacity-80">
                  {renderGameComponent(currentQuestion)}
                </div>
              </div>

              {/* Player 2 - Bottom */}
              <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute top-2 left-2 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                  <img src={matchData.player2_picture || '/default_avatar.png'} alt="P2" className="w-8 h-8 rounded-full border border-purple-400" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-[10px]">{matchData.player2_name || 'Joueur 2'}</span>
                    <span className="text-purple-400 font-bold text-[10px]">{scores.player2} pts</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 z-40 bg-black/40 px-2 py-1 rounded-lg">
                   <p className="text-emerald-400 font-bold text-[8px] uppercase">{p2Status}</p>
                </div>
                <div className="w-full scale-[0.6] origin-center pointer-events-none opacity-80">
                  {renderGameComponent(currentQuestion)}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse scale-150"></div>
                <Flame className="w-16 h-16 text-blue-400 relative z-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">EN ATTENTE DU MATCH</h3>
              <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">Préparez-vous pour l'action...</p>
              
              <div className="mt-8 flex items-center gap-2">
                 {[0, 1, 2].map(i => (
                   <motion.div
                     key={i}
                     animate={{ opacity: [0.2, 1, 0.2] }}
                     transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                     className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                   />
                 ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactions */}
      {gameState === 'watching' && (
        <div className="absolute right-2 bottom-20 z-50 flex flex-col gap-4 items-center">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group relative">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-[10px] font-bold">{likes}</span>
            <AnimatePresence>
              {floatingLikes.map(h => (
                <motion.div key={h.id} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -80 }} transition={{ duration: 0.8 }} className="absolute -top-4 text-red-500">
                  <Heart className="w-4 h-4 fill-red-500" />
                </motion.div>
              ))}
            </AnimatePresence>
          </button>
          <button onClick={() => setIsChatOpen(!isChatOpen)} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[10px] font-bold">{comments.length * 7}</span>
          </button>
        </div>
      )}

      {/* Comments overlay */}
      {gameState === 'watching' && (
        <div className="absolute left-2 bottom-6 z-50 w-40 pointer-events-none flex flex-col gap-1">
          <AnimatePresence>
            {comments.map(c => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 text-[9px] text-white">
                <span className="font-bold text-blue-300 mr-1">{c.user}:</span> {c.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Chat */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-4 left-0 right-0 px-4 z-[60] flex justify-center">
            <form onSubmit={handleSendComment} className="w-full max-w-sm flex bg-black/90 backdrop-blur-3xl border border-white/20 rounded-full p-1 shadow-2xl">
              <input type="text" autoFocus value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Commenter..." className="flex-1 bg-transparent text-white border-none outline-none px-4 text-xs" />
              <Button type="submit" size="sm" className="rounded-full bg-blue-600 h-8 px-4 text-[10px]">OK</Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SpectatorList = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/duo/active-matches`, { withCredentials: true });
      setMatches(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex && index >= 0 && index < matches.length) {
      setActiveIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f24]">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0f24] flex flex-col items-center justify-center p-6 text-white">
        <Button onClick={() => navigate('/dashboard')} variant="ghost" className="absolute top-6 left-6 text-white bg-white/10 rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Eye className="w-16 h-16 opacity-20 mb-6" />
        <h1 className="text-xl font-bold">Aucun match en direct</h1>
        <Button onClick={() => navigate('/dashboard')} className="mt-8 bg-blue-600 rounded-full">Retour</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <Button onClick={() => navigate('/dashboard')} variant="ghost" className="absolute top-4 left-4 z-50 text-white bg-black/40 rounded-full w-10 h-10 p-0 flex items-center justify-center border border-white/10">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div ref={containerRef} onScroll={handleScroll} className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
        {matches.map((match, index) => (
          <SpectatorMatchSlide key={match.match_id} match={match} isActive={index === activeIndex} />
        ))}
      </div>
    </div>
  );
};

const SpectatorView = () => {
    const navigate = useNavigate();
    useEffect(() => { navigate('/spectate'); }, [navigate]);
    return null;
}

export { SpectatorList, SpectatorView };
