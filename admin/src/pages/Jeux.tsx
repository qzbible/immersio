import React, { useEffect, useState, Suspense, useRef } from 'react';
import axios from 'axios';
import {
  Search, Filter, Plus, Edit2, Trash2, CheckCircle,
  AlertCircle, X, ListOrdered, Play, Globe, Shield, Copy,
  Sparkles, Check, ChevronRight, ChevronLeft, Send, Brain, Building2,
  FileUp, Trash, Tag, Star, Layout, FileText, ChevronDown, Monitor, Smartphone,
  Eye, HelpCircle, Save, Info, Settings2, RefreshCw, Volume2
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrganization } from '../hooks/useOrganization';
import { toast } from '../components/Toaster';
import ConfirmModal from '../components/ConfirmModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const QUESTION_TYPES = [
  { value: "single_choice", label: "Choix Unique" },
  { value: "multiple_choice", label: "Choix Multiple" },
  { value: "true_false", label: "Vrai / Faux" },
  { value: "qui_a_dit", label: "Qui a dit ?" },
  { value: "chrono_versets", label: "Verset à trous" },
  { value: "anagrammes", label: "Anagramme" },
];

const JeuxPageInner = () => {
  const navigate = useNavigate();
  const { isOwner, isSystem, activeOrgId } = useOrganization();
  const [activeTab, setActiveTab] = useState<'questions' | 'modes'>('questions');
  const [items, setItems] = useState<any[]>([]);
  const [modes, setModes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  
  const [manualViewOpen, setManualViewOpen] = useState(false);
  const [modeConfigOpen, setModeConfigOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingMode, setEditingMode] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testQuestion, setTestQuestion] = useState<any>(null);
  const [demoViewOpen, setDemoViewOpen] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState<string | null>(null);
  const [audioBank, setAudioBank] = useState<{ music: any[], sfx: any[] }>({ music: [], sfx: [] });

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

  // Form states
  const [formData, setFormData] = useState({
    lang: 'fr',
    difficulty: 'moyen',
    text: '',
    answer: '' as any,
    options: ['', '', '', ''],
    reference: '',
    approved: true,
    tags: [] as string[],
    type: 'single_choice',
    score: 10,
    author: '',
    missing_word: '',
    word: '',
    hint: ''
  });

  const [modeFormData, setModeFormData] = useState({
    mode_id: '',
    name: '',
    description: '',
    icon: 'Play',
    difficulty: 'moyen',
    duration_minutes: 5,
    color: 'from-blue-400 to-blue-600',
    question_ids: [] as string[],
    sync_tags: [] as string[],
    bg_music: '',
    sfx_success: '',
    sfx_fail: '',
    sfx_click: '',
    volume: 0.3
  });

  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  useEffect(() => {
    if (activeTab === 'questions') fetchItems();
    else fetchModes();
    fetchAvailableTags();
    fetchAudioBank();
  }, [activeTab, search, filterDifficulty]);

  const fetchAudioBank = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/audio-bank`, { withCredentials: true });
      setAudioBank(resp.data);
    } catch (err) { console.error(err); }
  };

  const fetchAvailableTags = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/tags`, { withCredentials: true });
      setAvailableTags(resp.data);
    } catch (err) { console.error(err); }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterDifficulty) params.difficulty = filterDifficulty;
      const resp = await axios.get(`${BACKEND_URL}/api/admin/questions`, { params, withCredentials: true });
      setItems(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchModes = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/game-modes`, { withCredentials: true });
      setModes(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSaveManual = async () => {
     try {
       let payload = { ...formData };
       if (formData.type === 'qui_a_dit') payload.answer = formData.author;
       else if (formData.type === 'chrono_versets') payload.answer = formData.missing_word;

       if (editingItem) {
         await axios.patch(`${BACKEND_URL}/api/admin/questions/${editingItem.question_id}`, payload, { withCredentials: true });
       } else {
         await axios.post(`${BACKEND_URL}/api/admin/questions`, payload, { withCredentials: true });
       }
       setManualViewOpen(false);
       toast.success("Question enregistrée !");
       fetchItems();
     } catch (err) { toast.error("Erreur sauvegarde : Vérifiez vos droits d'accès."); }
  };

  const handleSaveMode = async () => {
    try {
      if (editingMode && editingMode.owner_id !== 'system') {
        await axios.patch(`${BACKEND_URL}/api/admin/game-modes/${editingMode.mode_id}`, modeFormData, { withCredentials: true });
      } else {
        const newModeId = `mode_${Math.random().toString(36).substr(2, 9)}`;
        await axios.post(`${BACKEND_URL}/api/admin/game-modes`, { ...modeFormData, mode_id: newModeId }, { withCredentials: true });
      }
      setModeConfigOpen(false);
      toast.success("Mode enregistré avec succès !");
      fetchModes();
    } catch (err) { toast.error("Erreur sauvegarde mode"); }
  };

  const syncModeByTags = async () => {
    if (!editingMode || editingMode.owner_id === 'system') return;
    try {
      const resp = await axios.post(`${BACKEND_URL}/api/admin/game-modes/${editingMode.mode_id}/sync-by-tags`, modeFormData.sync_tags, { withCredentials: true });
      toast.success(`${resp.data.synced} questions synchronisées par tags !`);
      fetchModes();
    } catch (err) { toast.error("Erreur lors de la synchronisation"); }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const addModeTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!modeFormData.sync_tags.includes(tagInput.trim())) {
        setModeFormData({ ...modeFormData, sync_tags: [...modeFormData.sync_tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const renderQuestionPreview = (data: any, isInteractive = false) => {
    const isTF = data.type === 'true_false';
    const isChrono = data.type === 'chrono_versets';
    const isAnagramme = data.type === 'anagrammes';

    const handleAnswerClick = (answerValue: string) => {
      if (isInteractive) {
        setPreviewAnswer(answerValue);
      }
    };

    const getOptionStyle = (answerValue: string) => {
      if (!isInteractive || previewAnswer === null) return 'bg-white/5 border-white/5 text-white/40';
      
      const isCorrectOption = answerValue === data.answer?.toString();
      const isSelectedOption = answerValue === previewAnswer;

      if (isSelectedOption) {
        return isCorrectOption ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-red-500/20 text-red-400 border-red-500';
      }
      
      if (isCorrectOption) {
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      }
      return 'bg-white/5 border-white/5 text-white/40 opacity-50';
    };

    return (
      <div className={`mx-auto bg-admin-sidebar border border-white/10 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 ${previewMode === 'mobile' ? 'w-[300px] h-[550px]' : 'w-full max-w-lg p-6'}`}>
         {previewMode === 'mobile' && <div className="h-6 w-full flex justify-center items-center py-4 bg-black/20"><div className="w-16 h-1 bg-white/10 rounded-full"></div></div>}
         <div className="p-8 flex flex-col h-full bg-gradient-to-b from-transparent to-black/20">
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-wrap gap-1">
                   {data.tags?.map((t: string) => <span key={t} className="text-[8px] font-black py-0.5 px-2 bg-admin-accent/20 text-admin-accent rounded-full uppercase tracking-tighter">#{t}</span>)}
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-black text-xs shrink-0"><Star size={10} fill="currentColor" /> {data.score} pts</div>
            </div>
            <h4 className="text-xl font-bold text-white mb-8 leading-tight">
               {isAnagramme ? `Anagramme : ${data.word || "___"}` : isChrono ? (data.text || "Verset avec ___") : (data.text || "Votre question...")}
            </h4>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
               {isTF ? ['Vrai', 'Faux'].map((val, i) => (
                  <button onClick={() => handleAnswerClick(val)} key={i} className={`w-full py-4 px-6 rounded-2xl border flex items-center justify-between font-bold text-sm transition-all ${getOptionStyle(val)}`}> {val} </button>
               )) : data.options?.map((opt: string, i: number) => (
                  <button onClick={() => handleAnswerClick(i.toString())} key={i} className={`w-full py-4 px-6 rounded-2xl border flex items-center justify-between font-bold text-sm transition-all ${getOptionStyle(i.toString())}`}>
                     <span className="flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center text-[10px]">{String.fromCharCode(65 + i)}</span>{opt || `Option ${i + 1}`}</span>
                  </button>
               ))}
               
               {/* Affichage spécifique interactif pour input text si besoin */}
               {isInteractive && previewAnswer === null && (isChrono || isAnagramme) && (
                   <div className="mt-4">
                      <input 
                         type="text" 
                         className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-admin-accent" 
                         placeholder="Votre réponse..."
                         onKeyDown={(e) => { 
                             if(e.key === 'Enter') handleAnswerClick((e.target as HTMLInputElement).value.toUpperCase()); 
                         }}
                      />
                      <p className="text-[10px] text-white/30 text-center mt-2">Appuyez sur Entrée pour valider</p>
                   </div>
               )}
            </div>
            {data.reference && <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-2 text-white/30 italic text-xs"><FileText size={12} /> Ref: {data.reference}</div>}
         </div>
      </div>
    );
  };

  return (
    <div className="flex bg-admin-bg relative min-h-screen text-white">
      <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
        
        {/* HEADER & TABS */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic tracking-tight uppercase">Banque de Questions</h2>
            <div className="flex gap-4">
               <button onClick={() => setActiveTab('questions')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'questions' ? 'bg-admin-accent text-white' : 'bg-white/5 text-white/20 hover:text-white/40'}`}>Questions</button>
               <button onClick={() => setActiveTab('modes')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'modes' ? 'bg-admin-accent text-white' : 'bg-white/5 text-white/20 hover:text-white/40'}`}>Modes de Jeu</button>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setDemoViewOpen(true)} className="bg-white/5 hover:bg-white/10 text-emerald-400/80 hover:text-emerald-400 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all border border-emerald-400/10 hover:border-emerald-400/30">
              <Eye size={20} /> Exemples (Démo)
            </button>
            <button onClick={() => navigate('/ai-gen')} className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-admin-accent px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 border border-white/5 hover:border-admin-accent/50 group">
              <Sparkles size={20} className="group-hover:animate-pulse" /> Générer avec IA
            </button>
            <button onClick={() => { setEditingItem(null); setFormData({lang:'fr',difficulty:'moyen',text:'',answer:'',options:['','','',''],reference:'',approved:true,tags:[],type:'single_choice',score:10,author:'',missing_word:'',word:'',hint:''}); setManualViewOpen(true); }} className="bg-admin-accent hover:bg-admin-accent/80 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-admin-accent/20 active:scale-95">
              <Plus size={20} /> Créer Question
            </button>
          </div>
        </div>

        {activeTab === 'questions' ? (
          <>
            {/* SEARCH & FILTER */}
            <div className="bg-admin-card border border-white/5 rounded-3xl p-6 flex flex-wrap gap-6 items-center shadow-2xl backdrop-blur-sm">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <input type="text" placeholder="Rechercher par texte ou tag..." className="w-full bg-admin-bg border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-admin-accent transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-admin-card border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left font-sans">
                <thead className="bg-white/[0.03] border-b border-white/5">
                  <tr>
                    <th className="px-10 py-8 text-[10px] font-black text-white/30 uppercase tracking-[3px]">Questions</th>
                    <th className="px-10 py-8 text-[10px] font-black text-white/30 uppercase tracking-[3px]">Tags</th>
                    <th className="px-10 py-8 text-[10px] font-black text-white/30 uppercase tracking-[3px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((q) => {
                    const isStaff = q.owner_id === 'system';
                    const canEdit = !isStaff || isSystem;
                    return (
                      <tr key={q.question_id} className="hover:bg-white/[0.02] transition-all group">
                        <td className="px-10 py-8 max-w-md">
                           <div className="flex items-center gap-2 mb-2">
                              {isStaff ? <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Staff</span> : <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Org</span>}
                              <span className="text-[10px] font-bold text-white/40">{q.type}</span>
                           </div>
                           <p className="text-white text-lg font-bold leading-tight">{q.text || `Anagramme: ${q.word}`}</p>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex flex-wrap gap-1.5">
                              {q.tags?.map((t: string) => <span key={t} className="text-[8px] bg-white/5 text-white/20 px-2 py-0.5 rounded border border-white/5 font-bold uppercase tracking-tighter">#{t}</span>)}
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right flex justify-end gap-2">
                           <button onClick={() => { setPreviewAnswer(null); setTestQuestion(q); }} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Play size={16} /></button>
                           {canEdit ? (
                             <>
                               <button onClick={() => { setEditingItem(q); setFormData({...q, answer: q.answer?.toString() || ""}); setManualViewOpen(true); }} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white"><Edit2 size={16}/></button>
                               <button onClick={() => { 
                                 setConfirmConfig({
                                   isOpen: true,
                                   title: "Supprimer cette question ?",
                                   message: "Cette question sera retirée de la banque et de tous les modes qui l'utilisent.",
                                   type: 'danger',
                                   onConfirm: async () => {
                                     try {
                                       await axios.delete(`${BACKEND_URL}/api/admin/questions/${q.question_id}`, {withCredentials: true});
                                       toast.success("Question supprimée");
                                       fetchItems();
                                     } catch (err) {
                                       toast.error("Erreur lors de la suppression");
                                     }
                                   }
                                 });
                               }} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={16}/></button>
                             </>
                           ) : <span className="text-white/5 px-4 py-2 border border-white/5 rounded-xl text-[10px] font-bold uppercase">Lecture seule</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* MODES TAB */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {modes.map((m) => (
                <div key={m.mode_id} className="bg-admin-card border border-white/5 rounded-[40px] p-10 flex flex-col hover:border-admin-accent/50 transition-all group overflow-hidden relative shadow-2xl">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${m.color} blur-[60px] opacity-10 group-hover:opacity-20 transition-all`}></div>
                   <div className="flex justify-between items-start mb-8 relative">
                      <div className={`p-5 rounded-3xl bg-gradient-to-br ${m.color} text-white shadow-xl`}><Play size={24} fill="currentColor" /></div>
                      {m.owner_id === 'system' ? (
                        <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">Coquille Staff</span>
                      ) : (
                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest">Masterpiece Org</span>
                      )}
                   </div>
                   <h3 className="text-2xl font-black text-white mb-4 tracking-tighter italic">{m.name}</h3>
                   <p className="text-white/40 text-sm leading-relaxed mb-8 flex-1">{m.description}</p>
                   <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-white/20 italic">{m.question_ids?.length || 0} Questions</span>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => navigate(`/play/${m.mode_id}`)}
                           className="p-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-lg active:scale-90"
                           title="Tester"
                         >
                            <Play size={20}/>
                         </button>
                         <button onClick={() => { 
                           setEditingMode(m); 
                           setModeFormData({ 
                             mode_id: m.mode_id,
                             name: m.name,
                             description: m.description,
                             icon: m.icon,
                             difficulty: m.difficulty,
                             duration_minutes: m.duration_minutes,
                             color: m.color,
                             question_ids: m.question_ids || [],
                             sync_tags: m.sync_tags || [] 
                           }); 
                           setModeConfigOpen(true); 
                         }} className="p-4 bg-white/5 text-white hover:bg-admin-accent rounded-2xl transition-all shadow-lg active:scale-90">
                            {m.owner_id === 'system' ? (isSystem ? <Settings2 size={20}/> : <Copy size={20} />) : <Settings2 size={20} />}
                         </button>
                      </div>
                   </div>
                </div>
             ))}
             <button onClick={() => { 
                setEditingMode(null); 
                setModeFormData({ mode_id: '', name: 'Nouveau Mode', description: '', icon: 'Play', difficulty: 'moyen', duration_minutes: 5, color: 'from-purple-400 to-purple-600', question_ids: [], sync_tags: [] }); 
                setModeConfigOpen(true); 
             }} className="border-4 border-dashed border-white/5 rounded-[40px] p-10 flex flex-col items-center justify-center gap-4 text-white/20 hover:text-admin-accent hover:border-admin-accent/20 transition-all group">
                <div className="p-8 bg-white/5 rounded-full group-hover:bg-admin-accent/10 transition-all"><Plus size={40}/></div>
                <span className="text-xl font-black uppercase tracking-widest italic">Nouveau Mode</span>
             </button>
          </div>
        )}

      </div>

      {/* MANUAL QUESTION CREATOR */}
      {manualViewOpen && (
        <div className="fixed top-0 bottom-0 right-0 left-64 z-50 bg-admin-bg animate-in slide-in-from-right-full duration-500 flex flex-col">
           <div className="h-full flex overflow-hidden">
              <div className="w-[500px] border-r border-white/10 h-full flex flex-col bg-admin-card/80 backdrop-blur-3xl overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Craft Question</h3>
                    <button onClick={() => setManualViewOpen(false)} className="text-white/20 hover:text-white"><X size={28}/></button>
                 </div>
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Type</label>
                          <select className="w-full bg-admin-sidebar border border-white/10 rounded-2xl p-4 text-white font-bold" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                             {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2 relative">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Tags (Rechercher ou Créer)</label>
                          <input 
                            className="w-full bg-admin-sidebar border border-white/10 rounded-2xl p-4 text-white font-bold text-xs" 
                            placeholder="Thème, Personnage..." 
                            value={tagInput} 
                            onChange={(e)=>{ setTagInput(e.target.value); setShowTagSuggestions(true); }} 
                            onKeyDown={addTag}
                            onFocus={() => setShowTagSuggestions(true)}
                          />
                          {showTagSuggestions && tagInput && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-admin-sidebar border border-white/10 rounded-2xl shadow-2xl max-h-40 overflow-y-auto overflow-x-hidden border border-white/10">
                               {availableTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase())).map(t => (
                                 <div key={t} onClick={() => { if(!formData.tags.includes(t)) setFormData({...formData, tags: [...formData.tags, t]}); setTagInput(''); setShowTagSuggestions(false); }} className="px-4 py-3 hover:bg-admin-accent/20 cursor-pointer text-xs font-bold text-white/60 hover:text-white transition-all">
                                    {t}
                                 </div>
                               ))}
                               {!availableTags.some(t => t.toLowerCase() === tagInput.toLowerCase()) && (
                                 <div onClick={() => { if(!formData.tags.includes(tagInput)) setFormData({...formData, tags: [...formData.tags, tagInput]}); setTagInput(''); setShowTagSuggestions(false); }} className="px-4 py-3 hover:bg-emerald-500/20 cursor-pointer text-[10px] font-black text-emerald-400 border-t border-white/5 uppercase italic">
                                    + Créer "{tagInput}"
                                 </div>
                               )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                             {formData.tags?.map(t => <span key={t} className="px-2 py-1 bg-admin-accent/20 text-admin-accent text-[9px] font-black rounded flex items-center gap-1 uppercase tracking-tighter border border-admin-accent/10">#{t} <X size={8} className="cursor-pointer hover:text-red-400" onClick={()=>setFormData({...formData, tags: formData.tags.filter(tg=>tg!==t)})}/></span>)}
                          </div>
                       </div>
                    </div>
                    {formData.type === 'anagrammes' ? (
                       <div className="space-y-4">
                          <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold uppercase tracking-widest" placeholder="Mot" value={formData.answer} onChange={(e) => setFormData({...formData, answer: e.target.value.toUpperCase(), word: e.target.value.toUpperCase().split('').sort(() => Math.random() - 0.5).join('')})}/>
                          <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold text-sm" placeholder="Indice" value={formData.hint} onChange={(e) => setFormData({...formData, hint: e.target.value})}/>
                       </div>
                    ) : (
                       <textarea className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-bold text-lg min-h-[140px]" value={formData.text} onChange={(e) => setFormData({...formData, text: e.target.value})} placeholder={formData.type === 'chrono_versets' ? 'Verset avec ___' : 'Texte...'}/>
                    )}
                    {formData.type === 'chrono_versets' && <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" placeholder="Mot manquant" value={formData.missing_word} onChange={(e) => setFormData({...formData, missing_word: e.target.value})}/>}
                    {formData.type === 'qui_a_dit' && <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold" placeholder="Auteur" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})}/>}
                    {(formData.type === 'single_choice' || formData.type === 'multiple_choice' || formData.type === 'qui_a_dit') && (
                       <div className="space-y-2">
                          {formData.options.map((opt, i) => (
                             <div key={i} className="flex gap-2">
                                <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={opt} onChange={(e) => { const n = [...formData.options]; n[i] = e.target.value; setFormData({...formData, options: n}); }} placeholder={`Option ${i+1}`}/>
                                {formData.type !== 'qui_a_dit' && <button onClick={() => setFormData({...formData, answer: i.toString()})} className={`w-12 rounded-xl border flex items-center justify-center ${formData.answer === i.toString() ? 'bg-emerald-500 border-emerald-500' : 'border-white/10'}`}><Check size={16}/></button>}
                             </div>
                          ))}
                       </div>
                    )}
                    <input className="w-full bg-admin-sidebar border border-white/10 rounded-2xl p-4 text-white font-bold text-xs" value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} placeholder="Jean 3:16"/>
                 </div>
                 <button onClick={handleSaveManual} className="w-full py-6 bg-admin-accent hover:opacity-80 text-white rounded-[32px] font-black uppercase tracking-[4px] text-xs shadow-2xl transition-all">Sauvegarder Question</button>
              </div>
              <div className="flex-1 bg-admin-bg flex flex-col p-12">
                 <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                    <div className="flex justify-between items-center mb-10 opacity-10 uppercase italic font-black"><h4>Aperçu en Direct</h4><div className="flex gap-2"><div className={`p-2 rounded cursor-pointer ${previewMode==='desktop'?'bg-white/20':''}`} onClick={()=>setPreviewMode('desktop')}><Monitor size={16}/></div><div className={`p-2 rounded cursor-pointer ${previewMode==='mobile'?'bg-white/20':''}`} onClick={()=>setPreviewMode('mobile')}><Smartphone size={16}/></div></div></div>
                    <div className="flex-1 flex items-center justify-center">{renderQuestionPreview(formData)}</div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* QUESTION TESTER MODAL */}
      {testQuestion && (
        <div className="fixed inset-0 z-50 bg-admin-bg/95 backdrop-blur-3xl animate-in fade-in duration-500 flex items-center justify-center p-12">
            <div className="relative w-full max-w-lg">
                <button onClick={() => setTestQuestion(null)} className="absolute -top-16 right-0 p-4 bg-white/5 rounded-full hover:bg-red-500 hover:text-white text-white/40 transition-all"><X size={24}/></button>
                {renderQuestionPreview(testQuestion, true)}
                {previewAnswer !== null && (
                   <div className="mt-6 text-center">
                     <button onClick={() => setPreviewAnswer(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Recommencer</button>
                   </div>
                )}
            </div>
        </div>
      )}

      {/* DEMO VIEW MODAL */}
      {demoViewOpen && (
        <div className="fixed inset-0 z-50 bg-admin-bg/95 backdrop-blur-3xl animate-in fade-in duration-500 flex items-center justify-center p-12">
           <div className="bg-admin-card border border-white/10 rounded-[60px] w-full max-w-6xl h-full flex flex-col shadow-2xl overflow-hidden relative">
              <button onClick={() => setDemoViewOpen(false)} className="absolute top-10 right-10 p-4 bg-white/5 rounded-full hover:text-red-500 transition-all"><X size={32}/></button>
              
              <div className="p-12 text-center border-b border-white/5">
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Démo des Formats de Questions</h3>
                  <p className="text-white/40 mt-2 font-bold tracking-widest text-sm uppercase">Choisissez un modèle pour lancer la création</p>
              </div>

              <div className="flex-1 p-12 overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                     {[
                        { type: 'multiple_choice', title: 'Choix Multiple', color: 'text-admin-accent', data: { type: 'multiple_choice', text: 'Quels sont les fruits de l\'Esprit ?', answer: '0', options: ['Amour, Joie, Paix', 'Haine, Colère', 'Richesse, Gloire', 'Paresse, Sommeil'], score: 10, tags: ['galates'] } },
                        { type: 'true_false', title: 'Vrai Faux', color: 'text-pink-400', data: { type: 'true_false', text: 'Moïse a construit l\'arche d\'alliance.', answer: 'Faux', options: [], score: 5, tags: ['moïse', 'alliance'] } },
                        { type: 'qui_a_dit', title: 'Qui a dit ?', color: 'text-purple-400', data: { type: 'qui_a_dit', text: '"Je suis le chemin, la vérité, et la vie."', answer: '0', options: ['Jésus', 'Pierre', 'Paul', 'Jean'], score: 15, tags: ['jésus', 'parole'], author: 'Jésus' } },
                        { type: 'anagrammes', title: 'Anagrammes', color: 'text-orange-400', data: { type: 'anagrammes', word: 'AEUMN', answer: 'NAHUM', options: [], score: 20, tags: ['prophète'] } },
                        { type: 'chrono_versets', title: 'Verset à Trous', color: 'text-emerald-400', data: { type: 'chrono_versets', text: 'Au commencement, Dieu créa les cieux et la ___.', answer: 'TERRE', missing_word: 'TERRE', options: [], score: 10, tags: ['genèse', 'création'] } }
                     ].map((item, idx) => (
                        <div key={idx} className="space-y-4">
                           <div className={`text-center font-black uppercase ${item.color} text-sm tracking-widest`}>{item.title}</div>
                           <div className="pointer-events-none">{renderQuestionPreview(item.data, false)}</div>
                           <div className="flex justify-center">
                              <button onClick={() => { setFormData({...item.data, lang: 'fr', difficulty: 'moyen', reference: '', approved: true} as any); setDemoViewOpen(false); setManualViewOpen(true); }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/30">
                                 Utiliser ce modèle
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* MODE CONFIGURATION / CLONE */}
      {modeConfigOpen && (
        <div className="fixed inset-0 z-50 bg-admin-bg/95 backdrop-blur-3xl animate-in fade-in duration-500 flex items-center justify-center p-12">
           <div className="bg-admin-card border border-white/10 rounded-[60px] w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
                 <div className="flex items-center gap-4">
                    <Settings2 size={32} className="text-admin-accent" />
                    <div>
                       <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                          {editingMode?.owner_id === 'system' && !isSystem ? 'Cloner le Mode' : 'Configuration'}
                       </h3>
                       <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Coquille: {editingMode?.name || 'Nouveau'}</p>
                    </div>
                 </div>
                 <button onClick={() => setModeConfigOpen(false)} className="p-4 bg-white/5 rounded-full hover:text-red-500 transition-all"><X size={32}/></button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="w-[450px] border-r border-white/5 p-12 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nom du Mode</label>
                          <input disabled={editingMode?.owner_id === 'system' && !isSystem} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-black disabled:opacity-50" value={modeFormData.name} onChange={(e)=>setModeFormData({...modeFormData, name: e.target.value})}/>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Description</label>
                          <textarea disabled={editingMode?.owner_id === 'system' && !isSystem} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm min-h-[100px] disabled:opacity-50" value={modeFormData.description} onChange={(e)=>setModeFormData({...modeFormData, description: e.target.value})}/>
                       </div>
                    </div>
                    {editingMode?.owner_id === 'system' && !isSystem ? (
                       <button onClick={handleSaveMode} className="w-full py-6 bg-admin-accent text-white rounded-[32px] font-black uppercase tracking-[4px] shadow-2xl transition-all active:scale-95 text-xs">Cloner pour mon Org</button>
                    ) : (
                        <div className="space-y-6">
                            {/* Paramètres Audio */}
                            <div className="bg-white/5 rounded-3xl p-6 space-y-6 border border-white/5 font-sans">
                                <h4 className="text-xs font-black text-white/40 italic flex items-center gap-2 uppercase tracking-widest leading-none">
                                  <Volume2 size={14} className="text-admin-accent" /> Audio & Ambience
                                </h4>
                                
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/20 tracking-widest">
                                      <span>Volume</span>
                                      <span>{Math.round(modeFormData.volume * 100)}%</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="1" step="0.05"
                                    className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-admin-accent"
                                    value={modeFormData.volume}
                                    onChange={(e) => setModeFormData({...modeFormData, volume: parseFloat(e.target.value)})}
                                  />
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-black uppercase text-white/20 tracking-widest">Musique de Fond</label>
                                      <div className="flex gap-2">
                                        <select 
                                          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-admin-accent outline-none font-sans"
                                          value={modeFormData.bg_music}
                                          onChange={(e) => setModeFormData({...modeFormData, bg_music: e.target.value})}
                                        >
                                            <option value="">Silence</option>
                                            {audioBank.music.map((m: any) => <option key={m.id} value={m.url}>{m.name}</option>)}
                                        </select>
                                        {modeFormData.bg_music && (
                                            <button 
                                              onClick={() => {
                                                const url = modeFormData.bg_music.startsWith('/static/') ? `${BACKEND_URL}${modeFormData.bg_music}` : modeFormData.bg_music;
                                                const a = new Audio(url);
                                                a.volume = modeFormData.volume;
                                                a.play();
                                                setTimeout(() => a.pause(), 3000);
                                              }}
                                              className="p-3 bg-admin-accent/10 border border-admin-accent/20 text-admin-accent rounded-xl hover:bg-admin-accent hover:text-white transition-all"
                                            >
                                              <Play size={14} />
                                            </button>
                                        )}
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3">
                                      {['sfx_success', 'sfx_fail', 'sfx_click'].map(key => (
                                        <div key={key} className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-white/20 tracking-widest">
                                              {key === 'sfx_success' ? 'Succès' : key === 'sfx_fail' ? 'Échec' : 'Clic'}
                                            </label>
                                            <div className="flex gap-2">
                                              <select 
                                                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-white focus:border-admin-accent outline-none font-sans"
                                                value={(modeFormData as any)[key]}
                                                onChange={(e) => setModeFormData({...modeFormData, [key]: e.target.value})}
                                              >
                                                  <option value="">Par défaut</option>
                                                  {audioBank.sfx.map((s: any) => <option key={s.id} value={s.url}>{s.name}</option>)}
                                              </select>
                                              {(modeFormData as any)[key] && (
                                                  <button 
                                                    onClick={() => {
                                                      const u = (modeFormData as any)[key];
                                                      const url = u.startsWith('/static/') ? `${BACKEND_URL}${u}` : u;
                                                      const a = new Audio(url);
                                                      a.volume = modeFormData.volume;
                                                      a.play();
                                                    }}
                                                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                                  >
                                                      <Play size={12} />
                                                  </button>
                                              )}
                                            </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                            </div>
                            <button onClick={handleSaveMode} className="w-full py-6 bg-emerald-600 text-white rounded-[32px] font-black uppercase tracking-[4px] shadow-2xl transition-all active:scale-95 text-xs">Sauvegarder Configuration</button>
                        </div>
                    )}
                 </div>
                 <div className="flex-1 p-12 bg-black/10 flex flex-col space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="bg-admin-accent/5 border border-admin-accent/20 rounded-[32px] p-8 space-y-6">
                       <h4 className="text-xl font-black text-white italic flex items-center gap-3 uppercase"><RefreshCw size={20} className="text-admin-accent" /> Alimentation par Tags</h4>
                       <p className="text-white/40 text-xs leading-relaxed font-bold">Définissez des tags pour importer automatiquement des questions correspondantes depuis la banque globale.</p>
                       <div className="space-y-4 relative">
                          <input 
                            disabled={editingMode?.owner_id === 'system' && !isSystem} 
                            className="w-full bg-admin-bg border border-white/10 rounded-2xl p-5 text-white font-bold disabled:opacity-50 text-xs" 
                            placeholder="Tag (ex: Moïse)..." 
                            value={tagInput} 
                            onChange={(e)=>{ setTagInput(e.target.value); setShowTagSuggestions(true); }} 
                            onKeyDown={addModeTag}
                            onFocus={() => setShowTagSuggestions(true)}
                          />
                          {showTagSuggestions && tagInput && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-admin-sidebar border border-white/10 rounded-2xl shadow-2xl max-h-40 overflow-y-auto overflow-x-hidden">
                               {availableTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase())).map(t => (
                                 <div key={t} onClick={() => { if(!modeFormData.sync_tags.includes(t)) setModeFormData({...modeFormData, sync_tags: [...modeFormData.sync_tags, t]}); setTagInput(''); setShowTagSuggestions(false); }} className="px-4 py-3 hover:bg-admin-accent/20 cursor-pointer text-[10px] font-bold text-white/60 hover:text-white transition-all uppercase italic">
                                    {t}
                                 </div>
                               ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                             {modeFormData.sync_tags?.map(t => <span key={t} className="px-4 py-2 bg-admin-accent text-white text-[10px] font-black rounded-xl flex items-center gap-2 uppercase tracking-widest italic">{t} {!(editingMode?.owner_id === 'system' && !isSystem) && <X size={12} className="cursor-pointer" onClick={()=>setModeFormData({...modeFormData, sync_tags: modeFormData.sync_tags.filter(tg=>tg!==t)})}/>}</span>)}
                          </div>
                       </div>
                       {!(editingMode?.owner_id === 'system' && !isSystem) && (
                         <button onClick={syncModeByTags} className="w-full py-5 border-2 border-admin-accent text-admin-accent hover:bg-admin-accent hover:text-white rounded-3xl font-black uppercase tracking-[3px] text-[10px] transition-all">Synchroniser les Questions</button>
                       )}
                    </div>
                    {editingMode?.owner_id === 'system' && !isSystem && (
                       <div className="bg-blue-500/10 border border-blue-500/20 rounded-[32px] p-8 flex items-center gap-4 text-blue-400">
                          <Info size={24} />
                          <p className="text-xs font-bold leading-relaxed">Vous consultez un mode système BibleQuest. Pour le modifier ou y ajouter vos propres questions, commencez par le **Cloner**.</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
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

const JeuxPage = () => {
  return (
    <Suspense fallback={<div className="p-8 text-white/40 flex items-center justify-center h-screen bg-admin-bg"><div className="w-10 h-10 border-4 border-admin-accent border-t-transparent animate-spin rounded-full"></div></div>}>
      <JeuxPageInner />
    </Suspense>
  );
};

export default JeuxPage;
