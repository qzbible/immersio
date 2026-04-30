import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Zap, Plus, Trash2, X, ListOrdered, RefreshCw, ExternalLink, Music, Volume2, Shield, Globe, Copy, Search, CheckCircle, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import { toast } from '../components/Toaster';
import ConfirmModal from '../components/ConfirmModal';
import { useOrganization } from '../hooks/useOrganization';

import GameEditor from './GameEditor';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const GamesPage = () => {
  const { isOwner, isSystem } = useOrganization();
  const navigate = useNavigate();
  const [modes, setModes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // GameEditor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<any>(null);

  // ConfirmModal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/game-modes`, { withCredentials: true });
      setModes(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = async (modeId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/admin/game-modes/${modeId}`, {
        available: !currentStatus
      }, { withCredentials: true });
      setModes(modes.map(m => m.mode_id === modeId ? { ...m, available: !currentStatus } : m));
      toast.success(`Mode ${!currentStatus ? 'activé' : 'désactivé'}`);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du mode");
    }
  };

  const handleDelete = (modeId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer ce mode ?",
      message: "Cette action est irréversible. Toutes les configurations de ce mode seront perdues.",
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`${BACKEND_URL}/api/admin/game-modes/${modeId}`, { withCredentials: true });
          setModes(modes.filter(m => m.mode_id !== modeId));
          toast.success("Mode supprimé avec succès");
        } catch (err) {
          toast.error("Erreur lors de la suppression");
        }
      }
    });
  };

  const handleFork = async (mode: any, skipConfirm: boolean = false) => {
    // if (!skipConfirm && !window.confirm(`Dupliquer le mode "${mode.name}" dans votre espace actuel ?`)) return;
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/admin/game-modes/${mode.mode_id}/fork`, {}, { withCredentials: true });
      toast.success("Mode dupliqué avec succès");
      fetchModes();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de la duplication");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: any = null) => {
    setEditingMode(mode);
    setEditorOpen(true);
  };

  const handleOpenCustomize = (mode: any) => {
    setEditingMode(mode);
    setEditorOpen(true);
  };

  const handleSync = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Synchronisation du contenu",
      message: "Voulez-vous importer les questions par défaut (hardcoded) dans la base de données ? Cela peut créer des doublons si déjà importées.",
      type: 'info',
      onConfirm: async () => {
        try {
          setLoading(true);
          await axios.post(`${BACKEND_URL}/api/admin/sync-content`, {}, { withCredentials: true });
          toast.success("Synchronisation réussie !");
          fetchModes();
        } catch (err: any) {
          toast.error("Erreur lors de la synchronisation");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePlay = (modeId: string) => {
    navigate(`/play/${modeId}`);
  };

  const [modeSearch, setModeSearch] = useState('');

  const orgModes = modes.filter(m =>
    (isSystem || m.owner_id !== 'system') &&
    (m.name?.toLowerCase().includes(modeSearch.toLowerCase()) ||
      m.description?.toLowerCase().includes(modeSearch.toLowerCase()))
  );
  const systemModes = isSystem ? [] : modes.filter(m => m.owner_id === 'system');

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">Configuration des <span className="text-admin-accent">Modes</span></h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Gérez vos modules et règles de jeu personnalisées.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="text"
              placeholder="Chercher dans mes modes..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs text-white focus:border-admin-accent outline-none transition-all font-bold"
              value={modeSearch}
              onChange={(e) => setModeSearch(e.target.value)}
            />
          </div>
          {isOwner && (
            <button
              onClick={handleSync}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all border border-white/10"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Sync
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="bg-admin-accent hover:bg-admin-accent/80 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] flex items-center gap-2 transition-all shadow-xl shadow-admin-accent/20"
            >
              <Plus size={20} /> Nouveau Mode
            </button>
          )}
        </div>
      </div>

      {/* SECTION: MY CUSTOM MODES */}
      <section className="space-y-8">
        <div className="flex items-center gap-6">
          <h3 className="text-[10px] font-black text-white tracking-[0.4em] flex items-center gap-3 shrink-0">
            <Shield size={16} className="text-admin-accent" /> MES MODES (<span className="text-admin-accent">{orgModes.length}</span>)
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-white/20 italic font-bold tracking-widest animate-pulse uppercase">Initialisation...</div>
          ) : orgModes.length === 0 ? (
            <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[40px] text-center text-white/20">
              <p className="font-black uppercase tracking-widest text-xs mb-2">Aucun mode trouvé</p>
              <button onClick={() => setShowTemplatePicker(true)} className="text-[10px] text-admin-accent hover:underline font-black uppercase tracking-widest">Créer mon premier mode</button>
            </div>
          ) : orgModes.map((mode) => (
            <div key={mode.mode_id} className="bg-admin-card border border-white/5 rounded-[32px] p-6 hover:border-admin-accent/30 transition-all group relative overflow-hidden shadow-2xl flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-white/5 text-white/80 group-hover:bg-admin-accent/20 group-hover:text-admin-accent transition-all">
                  <span className="text-2xl">{mode.icon || '🎮'}</span>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handlePlay(mode.mode_id)}
                    className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                    title="Tester"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenCustomize(mode)}
                    className="p-2.5 rounded-xl bg-admin-accent/10 text-admin-accent hover:bg-admin-accent hover:text-white transition-all"
                    title="Configurer"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(mode.mode_id)}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-black text-white mb-2 leading-tight uppercase tracking-tight italic group-hover:text-admin-accent transition-colors">{mode.name}</h3>
                <p className="text-[10px] text-white/30 mb-8 line-clamp-2 font-bold uppercase tracking-widest leading-loose">{mode.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/40 tracking-widest bg-white/5 px-2.5 py-1 rounded-full">
                  <Zap size={10} className="text-admin-yellow" />
                  <span>{mode.category}</span>
                </div>
                <button
                  onClick={() => toggleMode(mode.mode_id, mode.available)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[8px] font-black transition-all tracking-[0.2em] ${mode.available
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/5 text-white/20 border border-white/5'
                    }`}
                >
                  {mode.available ? "ACTIF" : "OFF"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: SYSTEM TEMPLATES */}
      <section className="space-y-6 pt-12 border-t border-white/5">
        <div className="flex items-center gap-4">
          <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-2">
            <Globe size={14} /> MODÈLES BIBLEQUEST
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {systemModes.map((mode) => (
            <div key={mode.mode_id} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all group opacity-40 hover:opacity-100 flex items-center gap-4">
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all shrink-0">{mode.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black text-white uppercase tracking-tight truncate">{mode.name}</h4>
                <button
                  onClick={() => handleFork(mode)}
                  className="text-[8px] font-black text-admin-accent uppercase tracking-widest hover:underline mt-1 flex items-center gap-1"
                >
                  <Copy size={10} /> Personnaliser
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEMPLATE PICKER MODAL (FOR THE "+" BUTTON) */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowTemplatePicker(false)}></div>
          <div className="bg-admin-card border border-white/10 rounded-[48px] w-full max-w-4xl max-h-[85vh] overflow-hidden relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col border-t-white/20">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Nouvelle <span className="text-admin-accent">Configuration</span></h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Choisissez un modèle de base pour commencer</p>
              </div>
              <button onClick={() => setShowTemplatePicker(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
              {systemModes.map(mode => (
                <div
                  key={`picker-${mode.mode_id}`}
                  onClick={() => {
                    handleFork(mode, true);
                    setShowTemplatePicker(false);
                  }}
                  className="bg-white/5 border border-white/5 rounded-[32px] p-8 hover:border-admin-accent/50 hover:bg-admin-accent/5 transition-all group cursor-pointer flex items-center gap-8 shadow-sm"
                >
                  <div className="text-5xl p-6 bg-black/20 rounded-3xl group-hover:scale-110 transition-transform shadow-inner">{mode.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">{mode.name}</h4>
                    <p className="text-[9px] font-black text-admin-accent/60 uppercase tracking-widest mt-1">{mode.category}</p>
                    <p className="text-[10px] text-white/30 line-clamp-2 mt-3 font-medium">{mode.description}</p>
                  </div>
                </div>
              ))}
              <div
                onClick={() => {
                  handleOpenModal();
                  setShowTemplatePicker(false);
                }}
                className="bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] p-8 hover:border-white/40 transition-all group cursor-pointer flex items-center justify-center gap-6"
              >
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white/20 group-hover:text-white transition-all group-hover:scale-110">
                  <Plus size={32} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-white/20 uppercase tracking-widest group-hover:text-white transition-all">Mode Vide</span>
                  <span className="block text-[10px] font-bold text-white/10 uppercase tracking-widest mt-1">Configuration libre</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <GameEditor
          mode={editingMode}
          onClose={() => setEditorOpen(false)}
          onSave={() => { 
            setEditorOpen(false); 
            toast.success("Configuration enregistrée");
            fetchModes(); 
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
      />
    </div>
  );
};

export default GamesPage;
