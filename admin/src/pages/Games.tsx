import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Settings, Zap, Plus, Trash2, X, ListOrdered, RefreshCw, ExternalLink, Music, Volume2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const GamesPage = () => {
  const navigate = useNavigate();
  const [modes, setModes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<any>(null);
  const [audioBank, setAudioBank] = useState<{ music: any[], sfx: any[] }>({ music: [], sfx: [] });

  const defaultForm = {
    mode_id: '',
    name: '',
    category: 'Quiz et Tests',
    description: '',
    icon: '🎮',
    difficulty: 'moyen',
    duration_minutes: 5,
    color: 'from-blue-400 to-blue-600',
    available: true,
    bg_music: '',
    sfx_success: '',
    sfx_fail: '',
    sfx_click: '',
    volume: 0.3,
  };

  // Form state
  const [formData, setFormData] = useState<any>(defaultForm);

  useEffect(() => {
    fetchModes();
    fetchAudioBank();
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

  const fetchAudioBank = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/audio-bank`, { withCredentials: true });
      setAudioBank(resp.data);
    } catch (err) {
      // Non-blocking
    }
  };

  const toggleMode = async (modeId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/admin/game-modes/${modeId}`, {
        available: !currentStatus
      }, { withCredentials: true });
      setModes(modes.map(m => m.mode_id === modeId ? { ...m, available: !currentStatus } : m));
    } catch (err) {
      alert("Erreur lors de la mise à jour du mode");
    }
  };

  const handleDelete = async (modeId: string) => {
    if (!window.confirm("Supprimer définitivement ce mode de jeu ?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/game-modes/${modeId}`, { withCredentials: true });
      setModes(modes.filter(m => m.mode_id !== modeId));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleOpenModal = (mode: any = null) => {
    if (mode) {
      setEditingMode(mode);
      setFormData({ ...defaultForm, ...mode });
    } else {
      setEditingMode(null);
      setFormData(defaultForm);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMode) {
        await axios.patch(`${BACKEND_URL}/api/admin/game-modes/${formData.mode_id}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/game-modes`, formData, { withCredentials: true });
      }
      setModalOpen(false);
      fetchModes();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    }
  };

  const handleSync = async () => {
    if (!window.confirm("Importer les questions par défaut (hardcoded) dans la base de données ?")) return;
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/admin/sync-content`, {}, { withCredentials: true });
      alert("Synchronisation réussie !");
      fetchModes();
    } catch (err: any) {
      alert("Erreur lors de la synchronisation");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (modeId: string) => {
    navigate(`/play/${modeId}`);
  };

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Modes de Jeu</h2>
          <p className="text-white/40 text-sm">Gérez les modules et les règles de jeu.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSync}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} /> Synchroniser
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-admin-accent hover:bg-admin-accent/80 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-admin-accent/20"
          >
            <Plus size={20} /> Nouveau Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full py-12 text-center text-white/40 italic">Téléchargement des configurations...</div>
        ) : modes.map((mode) => (
          <div key={mode.mode_id} className="bg-admin-card border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 text-white/60`}>
                <span className="text-2xl">{mode.icon}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handlePlay(mode.mode_id)}
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500/60 hover:bg-emerald-500 hover:text-white transition-all"
                  title="Jouer / Tester"
                >
                  <ExternalLink size={16} />
                </button>
                <button 
                  onClick={() => handleOpenModal(mode)}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                  title="Modifier"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(mode.mode_id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{mode.name}</h3>
            <p className="text-sm text-white/40 mb-6 line-clamp-2">{mode.description}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <Link 
                    to={`/jeux?category=${mode.mode_id}`}
                    className="flex items-center gap-1 text-xs text-admin-accent hover:underline"
                >
                    <ListOrdered size={14} />
                    <span>Questions</span>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-white/40">
                      <Zap size={14} className="text-admin-yellow" />
                      <span className="text-white/80">{mode.category}</span>
                  </div>
                  <button 
                      onClick={() => toggleMode(mode.mode_id, mode.available)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      mode.available 
                          ? 'bg-emerald-400/10 text-emerald-400' 
                          : 'bg-white/10 text-white/40'
                      }`}
                  >
                      {mode.available ? "ACTIF" : "OFF"}
                  </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-bg/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-admin-card border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingMode ? 'Modifier le Mode' : 'Nouveau Mode de Jeu'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Identifiant (ID)</label>
                  <input 
                    type="text" 
                    disabled={!!editingMode}
                    required
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent disabled:opacity-50"
                    placeholder="ex: quiz_flash"
                    value={formData.mode_id}
                    onChange={(e) => setFormData({...formData, mode_id: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Nom du mode</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    placeholder="ex: Quiz Flash"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Catégorie</label>
                  <select 
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Quiz et Tests</option>
                    <option>Jeux de Mots</option>
                    <option>Rapidité</option>
                    <option>Logique</option>
                    <option>Défis Flash</option>
                    <option>Aventure</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Icône (Emoji)</label>
                  <input 
                    type="text" 
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    placeholder="ex: ⚡"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Description</label>
                <textarea 
                  className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent h-24"
                  placeholder="Expliquez brièvement le but du jeu..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                 <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Difficulté</label>
                  <select 
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  >
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Durée (min)</label>
                  <input 
                    type="number" 
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-white/10 bg-admin-bg text-admin-accent focus:ring-admin-accent"
                      checked={formData.available}
                      onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    />
                    <span className="text-sm text-white/80">Disponible</span>
                  </label>
                </div>
              </div>

              {/* Audio Configuration */}
              <div className="border border-white/5 rounded-2xl p-5 space-y-4 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Music size={16} className="text-admin-accent" />
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Configuration Audio</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Musique de Fond</label>
                    <select
                      className="w-full bg-admin-bg border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-admin-accent"
                      value={formData.bg_music || ''}
                      onChange={(e) => setFormData({...formData, bg_music: e.target.value})}
                    >
                      <option value="">— Aucune musique —</option>
                      {audioBank.music.map(m => (
                        <option key={m.id} value={m.url}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Volume</label>
                    <div className="flex items-center gap-3">
                      <Volume2 size={16} className="text-white/30" />
                      <input
                        type="range" min="0" max="1" step="0.05"
                        className="flex-1 accent-admin-accent"
                        value={formData.volume ?? 0.3}
                        onChange={(e) => setFormData({...formData, volume: parseFloat(e.target.value)})}
                      />
                      <span className="text-xs text-white/40 w-8 text-right">{Math.round((formData.volume ?? 0.3) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {([
                    { field: 'sfx_success', label: 'Bip Succès ✅' },
                    { field: 'sfx_fail',    label: 'Bip Échec ❌' },
                    { field: 'sfx_click',   label: 'Clic 🖱️' },
                  ] as const).map(({ field, label }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{label}</label>
                      <select
                        className="w-full bg-admin-bg border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-admin-accent"
                        value={(formData as any)[field] || ''}
                        onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                      >
                        <option value="">— Aucun —</option>
                        {audioBank.sfx.map(s => (
                          <option key={s.id} value={s.url}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-xl bg-admin-accent text-white font-bold shadow-lg shadow-admin-accent/20 hover:bg-admin-accent/80 transition-all"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
