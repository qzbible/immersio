import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, Lock, Clock, Trophy, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GameModes = () => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [gameModes, setGameModes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameModes();
    fetchCategories();
  }, []);

  const fetchGameModes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/game-modes`, {
        withCredentials: true
      });
      setGameModes(response.data);
    } catch (error) {
      console.error('Erreur chargement modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/game-modes/categories`, {
        withCredentials: true
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setCategories([{ 
        name: 'Tous', 
        count: data.reduce((sum, cat) => sum + (cat.count || 0), 0) 
      }, ...data]);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setCategories([{ name: 'Tous', count: 0 }]);
    }
  };

  const filteredModes = selectedCategory === 'all' 
    ? gameModes 
    : gameModes.filter(mode => mode.category === selectedCategory);

  const startGame = (modeId) => {
    navigate(`/play/${modeId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:px-8 mb-4">
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.back')}
        </Button>
        <LanguageSwitcher />
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
            {t('games.title')}
          </h1>
          <p className="text-lg text-blue-200" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {t('games.subtitle')}
          </p>
        </motion.div>

        <Tabs defaultValue="all" className="mb-10" onValueChange={setSelectedCategory}>
          <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 h-auto flex-wrap justify-start">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-yellow-400">{t('games.all')}</TabsTrigger>
            <TabsTrigger value="Quiz et Tests" className="rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-yellow-400">{t('games.quiz')}</TabsTrigger>
            <TabsTrigger value="Jeux de Mots" className="rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-yellow-400">{t('games.words')}</TabsTrigger>
            <TabsTrigger value="Rapidité" className="rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-yellow-400">{t('games.speed')}</TabsTrigger>
            <TabsTrigger value="Logique" className="rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-yellow-400">{t('games.logic')}</TabsTrigger>
            <TabsTrigger value="Défis Flash" className="rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-yellow-400">{t('games.flash')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 3D Glassmorphic Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModes.map((mode, index) => (
            <motion.div
              key={mode.mode_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
              className="group"
            >
              <div 
                onClick={() => mode.available && startGame(mode.mode_id)}
                className={`relative h-[380px] rounded-3xl overflow-hidden transition-all duration-500 transform lg:hover:-translate-y-4 lg:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] ${
                !mode.available ? 'opacity-60 grayscale' : 'cursor-pointer lg:hover:scale-[1.03]'
              }`}>
                {/* Background colored gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${mode.color || 'from-blue-600 to-indigo-900'} opacity-70 group-hover:opacity-90 transition-opacity duration-300`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f24] via-[#0a0f24]/80 to-transparent"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-auto">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                      {mode.icon}
                    </div>
                    {!mode.available && <Lock className="w-6 h-6 text-white/50" />}
                  </div>
                  
                  <div className="mt-auto transform transition-transform duration-300 lg:group-hover:-translate-y-2">
                    <h3 className="text-2xl font-black text-white mb-2 leading-tight drop-shadow-md" style={{ fontFamily: 'Fraunces, serif' }}>
                      {mode.name}
                    </h3>
                    
                    <p className="text-sm text-blue-200/90 line-clamp-3 mb-4 font-medium">
                      {mode.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs font-bold font-mono text-white/80 mb-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                        {mode.difficulty || 'Moyen'}
                      </span>
                      <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                        <Clock className="w-3 h-3" /> {mode.duration_minutes} min
                      </span>
                    </div>

                    <div className="w-full bg-white text-black font-black text-center py-3 rounded-xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] lg:group-hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-shadow">
                      {mode.available ? (
                        <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" /> JOUER</span>
                      ) : 'BIENTÔT DISPONIBLE'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredModes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-blue-200 text-lg">Aucun mode dans cette catégorie pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameModes;
