import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Copy, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ModeDuo = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState('menu');
  const [friendCode, setFriendCode] = useState('');
  const [matchData, setMatchData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [difficulty, setDifficulty] = useState('moyen');
  const [numModes, setNumModes] = useState(1);

  const createMatch = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/duo/matchmaking`, { 
        mode: 'friend',
        difficulty: difficulty,
        num_modes: numModes
      }, { withCredentials: true });
      setMatchData(response.data);
      setMode('waiting');
      startPolling(response.data.match_id, response.data.role, response.data.user_id);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const joinMatch = async () => {
    if (!friendCode) return;
    try {
      const response = await axios.post(`${BACKEND_URL}/api/duo/matchmaking`, { mode: 'friend', friend_code: friendCode }, { withCredentials: true });
      setMatchData(response.data);
      navigate(`/duo/play/${response.data.match_id}?role=player2&userId=${response.data.user_id}`);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const startPolling = (matchId, role, userId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/duo/${matchId}`, { withCredentials: true });
        if (response.data.status === 'ready') {
          clearInterval(interval);
          navigate(`/duo/play/${matchId}?role=${role}&userId=${userId}`);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(matchData.friend_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'waiting') {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full mx-4">
          <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20 text-center">
            <Users className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">{t('duo.waiting')}</h2>
            <div className="mb-6">
              <p className="text-blue-200 mb-3">{t('duo.share_code')}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 rounded-lg p-4 text-3xl font-bold text-yellow-400 tracking-widest">{matchData?.friend_code}</div>
                <Button onClick={copyCode} className="bg-white/10 hover:bg-white/20">
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {matchData?.selected_modes && (
              <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white text-sm font-bold mb-3 uppercase tracking-wider">Modes Sélectionnés ({matchData.selected_modes.length})</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {matchData.selected_modes.map((m, i) => (
                    <span key={i} className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-indigo-400/30 rounded-full text-sm font-medium text-indigo-200">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <Button onClick={() => navigate('/games')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">{t('duo.cancel')}</Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)' }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate('/games')} variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />{t('common.back')}
          </Button>
          <LanguageSwitcher />
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Fraunces, serif' }}>{t('duo.title')}</h1>
          <p className="text-lg text-blue-200">{t('duo.subtitle')}</p>
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => navigate('/duo/history')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">{t('duo.history')}</Button>
            <Button onClick={() => navigate('/duo/leaderboard')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">{t('duo.ranking')}</Button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20 h-full">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">{t('duo.create_match')}</h3>
              <p className="text-blue-200 mb-6 text-center text-sm">{t('duo.create_desc')}</p>
              
              <div className="space-y-4 mb-6 text-left">
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Niveau de difficulté</label>
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="très faible" className="bg-blue-900 text-white">Très faible</option>
                    <option value="faible" className="bg-blue-900 text-white">Faible</option>
                    <option value="moyen" className="bg-blue-900 text-white">Moyen</option>
                    <option value="un peu au-dessus de la moyenne" className="bg-blue-900 text-white">Un peu au-dessus de la moyenne</option>
                    <option value="fort" className="bg-blue-900 text-white">Fort</option>
                    <option value="très fort" className="bg-blue-900 text-white">Très fort</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Nombre de modes</label>
                  <select 
                    value={numModes} 
                    onChange={(e) => setNumModes(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1} className="bg-blue-900 text-white">1 Mode (Rapide)</option>
                    <option value={2} className="bg-blue-900 text-white">2 Modes</option>
                    <option value={3} className="bg-blue-900 text-white">3 Modes (Standard)</option>
                    <option value={5} className="bg-blue-900 text-white">5 Modes (Long)</option>
                  </select>
                </div>
              </div>

              <Button data-testid="create-duo-match" onClick={createMatch} className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">{t('duo.create_match')}</Button>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20 h-full">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">{t('duo.join_match')}</h3>
              <p className="text-blue-200 mb-6 text-center">{t('duo.join_desc')}</p>
              <Input data-testid="friend-code-input" value={friendCode} onChange={(e) => setFriendCode(e.target.value.toUpperCase())} placeholder={t('duo.friend_code')} className="mb-4 text-center text-2xl tracking-widest bg-white/10 border-white/20 text-white" maxLength={6} />
              <Button data-testid="join-duo-match" onClick={joinMatch} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">{t('duo.join')}</Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ModeDuo;
