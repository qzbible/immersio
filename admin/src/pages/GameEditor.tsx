import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { 
  ArrowLeft, Save, Plus, Trash2, Search, Settings, 
  GripVertical, Music, Volume2, Shield, Globe, Star, Play
} from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import { toast } from '../components/Toaster';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface GameEditorProps {
  mode: any | null; // null if creating a new mode
  onClose: () => void;
  onSave: () => void;
}

export default function GameEditor({ mode, onClose, onSave }: GameEditorProps) {
  const { isSystem } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings
  const [formData, setFormData] = useState<any>({
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
  });

  // UI States
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [audioBank, setAudioBank] = useState<{ music: any[], sfx: any[] }>({ music: [], sfx: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  // DnD lists
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch audio bank
      try {
        const audioResp = await axios.get(`${BACKEND_URL}/api/admin/audio-bank`, { withCredentials: true });
        setAudioBank(audioResp.data);
      } catch (err) { console.error(err); }

      // Fetch ALL questions for the current org context
      const questionsResp = await axios.get(`${BACKEND_URL}/api/admin/questions`, { withCredentials: true });
      const allQuestions = questionsResp.data || [];

      if (mode) {
        setFormData({ ...formData, ...mode });
        setSettingsOpen(false); // Collapsed by default if editing
        
        // Filter into selected and available
        const selectedIds = mode.question_ids || [];
        
        // Preserve order of selected questions as stored in the backend array
        const selected = selectedIds
          .map((id: string) => allQuestions.find((q: any) => q.question_id === id))
          .filter(Boolean); // removes undefined if a linked question was deleted

        const available = allQuestions.filter((q: any) => !selectedIds.includes(q.question_id));
        
        setSelectedQuestions(selected);
        setAvailableQuestions(available);
      } else {
        setAvailableQuestions(allQuestions);
        setSelectedQuestions([]);
      }
    } catch (err) {
      console.error("Error fetching data", err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    // Moving within the same list
    if (sourceId === destId) {
      if (sourceId === 'selected') {
        const items = Array.from(selectedQuestions);
        const [reorderedItem] = items.splice(sourceIndex, 1);
        items.splice(destIndex, 0, reorderedItem);
        setSelectedQuestions(items);
      }
      return;
    }

    // Moving from Available to Selected
    if (sourceId === 'available' && destId === 'selected') {
      const sourceClone = Array.from(availableQuestions);
      const destClone = Array.from(selectedQuestions);
      const [movedItem] = sourceClone.splice(sourceIndex, 1);
      
      destClone.splice(destIndex, 0, movedItem);
      
      setAvailableQuestions(sourceClone);
      setSelectedQuestions(destClone);
    }

    // Moving from Selected back to Available
    if (sourceId === 'selected' && destId === 'available') {
      const sourceClone = Array.from(selectedQuestions);
      const destClone = Array.from(availableQuestions);
      const [movedItem] = sourceClone.splice(sourceIndex, 1);
      
      destClone.splice(destIndex, 0, movedItem);
      
      setSelectedQuestions(sourceClone);
      setAvailableQuestions(destClone);
    }
  };

  const handleSaveData = async () => {
    setSaving(true);
    try {
      const finalData = {
        ...formData,
        question_ids: selectedQuestions.map(q => q.question_id)
      };

      if (mode) { // EDIT
        await axios.patch(`${BACKEND_URL}/api/admin/game-modes/${formData.mode_id}`, finalData, { withCredentials: true });
      } else { // CREATE
        await axios.post(`${BACKEND_URL}/api/admin/game-modes`, finalData, { withCredentials: true });
      }
      onSave(); // Notify parent
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailable = availableQuestions.filter(q => {
    const matchesSearch = q.text?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         q.word?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (Array.isArray(q.tags) && q.tags.some((t: string) => t?.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType = !typeFilter || q.type === typeFilter;
    const matchesDiff = !diffFilter || q.difficulty === diffFilter;
    return matchesSearch && matchesType && matchesDiff;
  });

  const canEditSettings = !mode || mode.owner_id === 'system' || (!isSystem && mode.owner_id !== 'system') || isSystem;
  const isReadOnlyMode = mode && mode.owner_id === 'system' && !isSystem;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-admin-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-admin-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-admin-bg animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="h-20 border-b border-white/5 bg-admin-card flex items-center justify-between px-8 shrink-0 relative z-10 shadow-xl">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <span className="text-2xl">{formData.icon}</span> 
              {formData.name || "Nouveau Mode"}
            </h2>
            <p className="text-xs font-bold text-admin-accent uppercase tracking-widest mt-1">
              {selectedQuestions.length} Questions configurées
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {mode && (
            <button 
              onClick={() => window.open(`/play/${formData.mode_id}`, '_blank')}
              className="px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all uppercase tracking-widest text-[10px] bg-white/10 text-white hover:bg-white/20 border border-white/10"
            >
              <Play size={14} /> Tester
            </button>
          )}
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all uppercase tracking-widest text-[10px] ${settingsOpen ? 'bg-white/10 text-white' : 'bg-transparent text-white/40 border border-white/10 hover:text-white hover:bg-white/5'}`}
          >
            <Settings size={14} /> Paramètres Généraux
          </button>
          <button 
            onClick={handleSaveData}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-admin-accent hover:bg-admin-accent/80 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-admin-accent/20 disabled:opacity-50 transition-all"
          >
             {saving ? "Enregistrement..." : <><Save size={16} /> Enregistrer le mode</>}
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL (EXPANDABLE) */}
      {settingsOpen && (
        <div className="bg-admin-card border-b border-white/5 p-8 shadow-2xl shrink-0 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Identifiant (ID)</label>
                  <input 
                    type="text" 
                    disabled={!!mode || isReadOnlyMode}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-admin-accent outline-none disabled:opacity-50 font-mono"
                    placeholder="ex: quiz_flash"
                    value={formData.mode_id}
                    onChange={(e) => setFormData({...formData, mode_id: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Nom du mode</label>
                  <input 
                    type="text" disabled={isReadOnlyMode}
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-admin-accent outline-none disabled:opacity-50 font-bold"
                    placeholder="ex: Quiz Flash"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-1 flex-1">
                     <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Icône (Emoji)</label>
                     <input 
                       type="text" disabled={isReadOnlyMode}
                       className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-lg text-center text-white focus:border-admin-accent outline-none disabled:opacity-50"
                       value={formData.icon}
                       onChange={(e) => setFormData({...formData, icon: e.target.value})}
                     />
                  </div>
                  <div className="space-y-1 flex-[2]">
                     <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Durée (min)</label>
                     <input 
                       type="number" disabled={isReadOnlyMode}
                       className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-admin-accent outline-none disabled:opacity-50 font-bold"
                       value={formData.duration_minutes}
                       onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                     />
                  </div>
                </div>
             </div>
             
             <div className="lg:col-span-4 space-y-4">
                <div className="space-y-1 h-full flex flex-col">
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Description</label>
                  <textarea 
                    disabled={isReadOnlyMode}
                    className="w-full flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-admin-accent outline-none disabled:opacity-50 resize-none min-h-[100px]"
                    placeholder="Message d'introduction pour ce mode..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
             </div>
             
             <div className="lg:col-span-4 space-y-4">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-wider flex justify-between items-center">
                           <span>Volume Global</span>
                           <span className="text-admin-accent font-mono">{Math.round((formData.volume || 0) * 100)}%</span>
                        </label>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => setFormData({...formData, volume: formData.volume > 0 ? 0 : 0.3})}
                             className={`p-2 rounded-lg transition-all ${formData.volume === 0 ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/40 hover:text-white'}`}
                           >
                             <Volume2 size={16} />
                           </button>
                           <input 
                             type="range" min="0" max="1" step="0.05"
                             className="flex-1 accent-admin-accent bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
                             value={formData.volume || 0}
                             onChange={(e) => setFormData({...formData, volume: parseFloat(e.target.value)})}
                           />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-wider flex justify-between">
                           <span>Musique de Fond</span>
                           <Music size={12} className="text-admin-accent" />
                        </label>
                        <div className="flex gap-2">
                          <select
                            disabled={isReadOnlyMode}
                            className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-admin-accent outline-none disabled:opacity-50 appearance-none"
                            value={formData.bg_music || ''}
                            onChange={(e) => setFormData({...formData, bg_music: e.target.value})}
                          >
                            <option value="">— Aucun (Silence) —</option>
                            {Array.isArray(audioBank?.music) ? audioBank.music.map(m => (
                              <option key={m.id} value={m.url}>{m.name}</option>
                            )) : null}
                          </select>
                          {formData.bg_music && (
                            <button 
                              onClick={() => {
                                const url = formData.bg_music.startsWith('/static/') ? `${BACKEND_URL}${formData.bg_music}` : formData.bg_music;
                                const audio = new Audio(url);
                                audio.volume = formData.volume || 0.3;
                                audio.play();
                                setTimeout(() => audio.pause(), 3000); // Preview for 3s
                              }}
                              className="p-3 bg-admin-accent/10 border border-admin-accent/20 rounded-xl text-admin-accent hover:bg-admin-accent hover:text-white transition-all"
                            >
                              <Play size={14} />
                            </button>
                          )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                       {['sfx_success', 'sfx_fail', 'sfx_click'].map((key) => (
                          <div key={key} className="space-y-1">
                             <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">
                                {key === 'sfx_success' ? 'Son de Succès' : key === 'sfx_fail' ? 'Son d\'Échec' : 'Son du Clic'}
                             </label>
                             <div className="flex gap-2">
                                <select
                                  disabled={isReadOnlyMode}
                                  className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-white focus:border-admin-accent outline-none disabled:opacity-50 appearance-none"
                                  value={formData[key] || ''}
                                  onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                                >
                                  <option value="">— Par défaut —</option>
                                  {Array.isArray(audioBank?.sfx) ? audioBank.sfx.map(s => (
                                    <option key={s.id} value={s.url}>{s.name}</option>
                                  )) : null}
                                </select>
                                {formData[key] && (
                                  <button 
                                    onClick={() => {
                                      const u = formData[key];
                                      const url = u.startsWith('/static/') ? `${BACKEND_URL}${u}` : u;
                                      const audio = new Audio(url);
                                      audio.volume = formData.volume || 0.3;
                                      audio.play();
                                    }}
                                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                  >
                                    <Play size={12} />
                                  </button>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-[10px] text-white/40 uppercase font-black tracking-wider">Catégorie</label>
                     <select 
                       disabled={isReadOnlyMode}
                       className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-admin-accent outline-none disabled:opacity-50 appearance-none"
                       value={formData.category}
                       onChange={(e) => setFormData({...formData, category: e.target.value})}
                     >
                       <option>Quiz et Tests</option>
                       <option>Jeux de Mots</option>
                       <option>Rapidité</option>
                     </select>
                   </div>
                   <div className="flex items-end pb-2">
                     <label className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all cursor-pointer ${formData.available ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/5 text-white/40'}`}>
                        <input 
                          type="checkbox" disabled={!canEditSettings}
                          className="sr-only" checked={formData.available}
                          onChange={(e) => setFormData({...formData, available: e.target.checked})}
                        />
                        <div className={`w-3 h-3 rounded-full ${formData.available ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{formData.available ? 'Actif' : 'Inactif'}</span>
                     </label>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* DND WORKSPACE */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 relative">
          <DragDropContext onDragEnd={handleDragEnd}>
             {/* LEFT: AVAILABLE QUESTIONS */}
             <div className="w-1/2 flex flex-col bg-admin-card rounded-[32px] border border-white/5 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-black/10 shrink-0">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                         <Search size={20} className="text-admin-accent" /> Banque Locale
                      </h3>
                      <div className="text-[10px] font-bold text-white/40 bg-white/5 px-3 py-1 rounded-full">{filteredAvailable.length} dispo.</div>
                   </div>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Chercher..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white focus:border-admin-accent outline-none text-xs transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select 
                        className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-[10px] font-bold text-white/50 outline-none"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                         <option value="">Tous types</option>
                         <option value="single_choice">QCM</option>
                         <option value="true_false">Vrai/Faux</option>
                         <option value="qui_a_dit">Qui a dit</option>
                         <option value="chrono_versets">Trous</option>
                         <option value="anagramme">Anagramme</option>
                      </select>
                      <select 
                        className="bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-[10px] font-bold text-white/50 outline-none"
                        value={diffFilter}
                        onChange={(e) => setDiffFilter(e.target.value)}
                      >
                         <option value="">Diff.</option>
                         <option value="facile">Facile</option>
                         <option value="moyen">Moyen</option>
                         <option value="difficile">Diff.</option>
                      </select>
                   </div>
                </div>
                
                <Droppable droppableId="available" isDropDisabled={false}>
                   {(provided, snapshot) => (
                      <div 
                         ref={provided.innerRef} 
                         {...provided.droppableProps}
                         className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-admin-accent/5' : ''}`}
                      >
                         {filteredAvailable.map((q, index) => (
                            <Draggable key={`avail-${q.question_id}`} draggableId={`avail-${q.question_id}`} index={index}>
                               {(provided, snapshot) => (
                                  <div
                                     ref={provided.innerRef}
                                     {...provided.draggableProps}
                                     {...provided.dragHandleProps}
                                     className={`group bg-admin-bg border border-white/5 rounded-2xl p-4 transition-all shadow-sm flex gap-4 ${snapshot.isDragging ? 'shadow-2xl border-admin-accent shadow-admin-accent/20 z-50 scale-[1.02]' : 'hover:border-white/20'}`}
                                  >
                                      <div className="flex flex-col items-center justify-center shrink-0 w-8 text-white/20 group-hover:text-admin-accent transition-colors">
                                         <GripVertical size={20} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 pb-1">
                                             <span className="text-[8px] font-black uppercase text-admin-accent bg-admin-accent/10 px-2 py-0.5 rounded tracking-widest">{q.type ? q.type.replace('_', ' ') : 'QUESTION'}</span>
                                             <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><Star size={10} fill="currentColor"/> {q.score || 10}</span>
                                          </div>
                                          <p className="text-sm font-bold text-white/90 line-clamp-2">{q.text || `Anagramme : ${q.word}`}</p>
                                          {Array.isArray(q.tags) && q.tags.length > 0 && (
                                             <div className="flex flex-wrap gap-1 mt-2">
                                                {q.tags.map((t: string) => <span key={t} className="text-[8px] border border-white/10 text-white/30 rounded px-1.5 uppercase font-bold tracking-tighter">#{t}</span>)}
                                             </div>
                                          )}
                                      </div>
                                  </div>
                               )}
                            </Draggable>
                         ))}
                         {provided.placeholder}
                         {filteredAvailable.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-white/20 italic p-10 text-center">
                               <Search size={48} className="mb-4 opacity-20" />
                               <p>Aucune question trouvée dans la banque.</p>
                            </div>
                         )}
                      </div>
                   )}
                </Droppable>
             </div>

             {/* RIGHT: SELECTED QUESTIONS (THE MODE) */}
             <div className="w-1/2 flex flex-col bg-admin-accent/5 rounded-[32px] border-2 border-dashed border-admin-accent/30 shadow-2xl overflow-hidden relative">
                {/* Visual anchor for drop zone indication */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-admin-accent/5 to-transparent opacity-50"></div>
                
                <div className="p-6 border-b border-admin-accent/20 bg-admin-accent/10 shrink-0 relative z-10">
                   <div className="flex justify-between items-center">
                      <div>
                         <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                            Questions du Mode
                         </h3>
                         <p className="text-[10px] font-bold text-admin-accent uppercase tracking-widest mt-1">Glissez-déposez ici</p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-admin-accent text-white font-black text-lg shadow-lg shadow-admin-accent/40">
                         {selectedQuestions.length}
                      </div>
                   </div>
                </div>

                <Droppable droppableId="selected">
                   {(provided, snapshot) => (
                      <div 
                         ref={provided.innerRef} 
                         {...provided.droppableProps}
                         className={`flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar relative z-10 transition-colors ${snapshot.isDraggingOver ? 'bg-admin-accent/10' : ''}`}
                      >
                         {selectedQuestions.map((q, index) => (
                            <Draggable key={`sel-${q.question_id}`} draggableId={`sel-${q.question_id}`} index={index}>
                               {(provided, snapshot) => (
                                  <div
                                     ref={provided.innerRef}
                                     {...provided.draggableProps}
                                     {...provided.dragHandleProps}
                                     className={`group bg-admin-card border border-admin-accent/20 rounded-2xl p-4 transition-all shadow-md flex gap-4 items-center ${snapshot.isDragging ? 'shadow-2xl border-admin-accent shadow-admin-accent/40 z-50 scale-[1.02]' : 'hover:border-admin-accent/50'}`}
                                  >
                                      <div className="flex flex-col items-center justify-center shrink-0 w-8 text-admin-accent/40 group-hover:text-admin-accent transition-colors">
                                         <GripVertical size={20} />
                                         <span className="text-[10px] font-black mt-1 opacity-50">{index + 1}</span>
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                          <p className="text-sm font-bold text-white line-clamp-1">{q.text || `Anagramme : ${q.word}`}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                             <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">{q.type ? q.type.replace('_', ' ') : 'QUESTION'}</span>
                                             <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><Star size={8} fill="currentColor"/> {q.score || 10}</span>
                                          </div>
                                      </div>

                                      <button 
                                        onClick={() => {
                                           // Manual remove (Fallback to clicking a button instead of dragging back)
                                           const destClone = Array.from(selectedQuestions);
                                           const sourceClone = Array.from(availableQuestions);
                                           const [removed] = destClone.splice(index, 1);
                                           sourceClone.push(removed);
                                           setSelectedQuestions(destClone);
                                           setAvailableQuestions(sourceClone);
                                        }}
                                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                  </div>
                               )}
                            </Draggable>
                         ))}
                         {provided.placeholder}
                         {selectedQuestions.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-full flex flex-col items-center justify-center text-admin-accent/40 italic p-10 text-center">
                               <div className="w-24 h-24 mb-6 rounded-full border-2 border-dashed border-admin-accent/40 flex items-center justify-center bg-admin-accent/5 animate-pulse">
                                  <Plus size={40} className="text-admin-accent/50" />
                               </div>
                               <h4 className="text-xl font-black uppercase tracking-tighter mb-2 text-admin-accent/80">Zone de Dépot</h4>
                               <p className="text-sm font-bold opacity-80 max-w-xs">Glissez des questions depuis la banque pour construire votre mode.</p>
                            </div>
                         )}
                      </div>
                   )}
                </Droppable>
             </div>
          </DragDropContext>
      </div>
    </div>
  );
}
