import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Sparkles, Send, Database, FileUp, X, Loader2, 
  CheckCircle, Plus, Info, Lightbulb, Trash2, Tag, 
  Settings, Brain, Layout, Eye, Save, Wand2, ArrowRight, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/Toaster';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const AIPage = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [genType, setGenType] = useState('vrai_faux');
  const [lang, setLang] = useState('fr');
  const [num, setNum] = useState(5);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contextText, setContextText] = useState('');
  const [contextFile, setContextFile] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await axios.post(`${BACKEND_URL}/api/admin/upload-context`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setContextText(resp.data.text);
      setContextFile(file.name);
    } catch (err) {
      toast.error("Erreur lors de l'extraction du texte.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic && !contextText) {
      toast.info("Veuillez saisir un thème ou fournir un contexte (fichier/texte).");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const resp = await axios.post(`${BACKEND_URL}/api/admin/generate`, {
        type: genType,
        topic,
        num_questions: num,
        lang,
        context_text: contextText
      }, { withCredentials: true });
      
      setResults(Array.isArray(resp.data) ? resp.data : []);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erreur lors de la génération.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const saveBulk = async () => {
    if (!results.length) return;
    try {
      const resp = await axios.post(`${BACKEND_URL}/api/admin/questions/bulk`, { questions: results }, { withCredentials: true });
      toast.success("Questions ajoutées à la banque !");
      setResults([]);
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  const removeResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col animate-in fade-in duration-500 text-white">
      
      {/* Header Bar */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-admin-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-admin-accent to-purple-600 rounded-2xl text-white shadow-lg shadow-admin-accent/20">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black italic tracking-tight uppercase">Laboratoire IA</h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Génération de contenu assistée</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/jeux')} className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl transition-all mr-4">
              Retour Banque
           </button>
           {results.length > 0 && (
              <button 
                onClick={saveBulk}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Save size={18} /> Sauvegarder {results.length} questions
              </button>
           )}
           {savedCount > 0 && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={14} /> {savedCount} Questions ajoutées à la banque !
              </div>
           )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Configuration & Context */}
        <div className="w-[450px] border-r border-white/5 flex flex-col bg-admin-card/30 overflow-y-auto custom-scrollbar">
           <div className="p-8 space-y-10">
              
              {/* Context Section */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white/30 uppercase tracking-[2px] flex items-center gap-2">
                       <FileUp size={14} /> Contexte Source
                    </h3>
                    {contextFile && (
                       <button onClick={() => { setContextFile(null); setContextText(''); }} className="text-red-400 hover:text-red-300 transition-colors">
                          <X size={14} />
                       </button>
                    )}
                 </div>
                 
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer flex flex-col items-center gap-4 text-center group
                        ${contextFile ? 'border-admin-accent/50 bg-admin-accent/5' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
                    `}
                 >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileUpload} />
                    {uploading ? (
                       <Loader2 className="w-10 h-10 text-admin-accent animate-spin" />
                    ) : contextFile ? (
                       <div className="space-y-2">
                          <div className="w-12 h-12 bg-admin-accent/20 rounded-2xl flex items-center justify-center mx-auto text-admin-accent">
                             <CheckCircle size={24} />
                          </div>
                          <p className="text-white font-bold text-sm truncate max-w-[200px]">{contextFile}</p>
                          <p className="text-[10px] text-white/40 uppercase">Fichier analysé avec succès</p>
                       </div>
                    ) : (
                       <>
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                             <FileUp size={24} className="text-white/20" />
                          </div>
                          <div>
                             <p className="text-white font-bold text-sm">Importer un document</p>
                             <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest leading-loose">PDF, DOCX, PPTX ou TXT pour guider l'IA</p>
                          </div>
                       </>
                    )}
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Ou Coller du texte</label>
                    <textarea 
                       className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-white text-xs min-h-[150px] focus:border-admin-accent/30 outline-none transition-all placeholder:text-white/10 italic"
                       placeholder="Extrait de sermon, chapitre de livre, notes..."
                       value={contextText}
                       onChange={(e) => setContextText(e.target.value)}
                    />
                 </div>
              </div>

              {/* Generation Settings */}
              <div className="space-y-6 pt-10 border-t border-white/5">
                 <h3 className="text-xs font-black text-white/30 uppercase tracking-[2px] flex items-center gap-2">
                    <Settings size={14} /> Paramètres
                 </h3>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Thème Principal</label>
                       <input 
                          className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white font-bold placeholder:text-white/10"
                          placeholder="Ex: Les Miracles de Jésus"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Type de Question</label>
                          <select className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white font-bold appearance-none outline-none focus:border-admin-accent/50" value={genType} onChange={(e)=>setGenType(e.target.value)}>
                             <option value="vrai_faux">Vrai ou Faux</option>
                             <option value="qui_a_dit">Qui a dit ?</option>
                             <option value="chrono_versets">Verset à trous</option>
                             <option value="anagrammes">Anagrammes</option>
                             <option value="single_choice">Choix Unique</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nombre</label>
                          <input type="number" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white font-bold" value={num} min={1} max={15} onChange={(e)=>setNum(parseInt(e.target.value))} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Langue</label>
                       <div className="flex gap-2">
                          {['fr', 'en'].map(l => (
                             <button key={l} onClick={() => setLang(l)} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${lang === l ? 'bg-admin-accent text-white shadow-lg shadow-admin-accent/20' : 'bg-white/5 text-white/20 hover:text-white/40'}`}>
                                {l === 'fr' ? '🇫🇷 Français' : '🇺🇸 English'}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-6 mt-6 bg-gradient-to-r from-admin-accent to-purple-600 text-white rounded-[32px] font-black uppercase tracking-[4px] text-xs shadow-xl shadow-admin-accent/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {loading ? (
                       <>
                          <Loader2 className="animate-spin" size={18} />
                          Inspiration en cours...
                       </>
                    ) : (
                       <>
                          <Sparkles size={18} />
                          Lancer la Génération
                       </>
                    )}
                 </button>
              </div>

           </div>
        </div>

        {/* Right Panel: Results Visualization */}
        <div className="flex-1 bg-black/10 p-12 overflow-y-auto custom-scrollbar relative">
           
           <div className="max-w-4xl mx-auto space-y-8">
              {results.length === 0 && !loading ? (
                 <div className="h-full flex flex-col items-center justify-center py-32 space-y-8 opacity-20">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                       <Brain size={48} />
                    </div>
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black uppercase tracking-[6px] italic">En attente d'inspiration</h3>
                       <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Configurez le laboratoire pour extraire de l'or biblique</p>
                    </div>
                 </div>
              ) : (
                 <>
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-xl font-black text-white italic flex items-center gap-3 uppercase tracking-tighter">
                          <Wand2 size={24} className="text-admin-accent" />
                          Questions Générées
                       </h3>
                       <span className="text-[10px] font-black bg-white/5 text-white/40 px-3 py-1.5 rounded-full uppercase tracking-widest">{results.length} Suggestions</span>
                    </div>

                    <div className="grid gap-6">
                       {results.map((q, idx) => (
                          <div key={idx} className="group bg-admin-card border border-white/5 rounded-[32px] p-8 hover:border-admin-accent/40 shadow-2xl transition-all relative overflow-hidden animate-in zoom-in-95 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => removeResult(idx)} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"><Trash2 size={16}/></button>
                             </div>

                             <div className="flex flex-wrap gap-2 mb-6">
                                <span className="text-[8px] font-black bg-admin-accent/20 text-admin-accent px-2 py-1 rounded-lg uppercase tracking-widest">{q.type || genType}</span>
                                {q.tags?.map((t: string) => (
                                   <span key={t} className="text-[8px] font-black bg-white/5 text-white/20 px-2 py-1 rounded-lg uppercase tracking-widest border border-white/5">#{t}</span>
                                ))}
                                <div className="flex-1"></div>
                                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1"><Star size={10} fill="currentColor" /> {q.score || 10} pts</span>
                             </div>

                             <h4 className="text-xl font-bold text-white mb-6 leading-tight group-hover:text-admin-accent transition-colors">{q.text || `Anagramme: ${q.word}`}</h4>
                             
                             <div className="grid grid-cols-2 gap-3 mb-6">
                                {q.options ? q.options.map((opt: string, oi: number) => {
                                   const isCorrect = Array.isArray(q.answer) ? q.answer.includes(oi) : q.answer === oi || q.answer === oi.toString();
                                   return (
                                      <div key={oi} className={`p-4 rounded-2xl text-xs font-bold transition-all border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                         {opt}
                                      </div>
                                   );
                                }) : (
                                  <div className="col-span-2 p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-emerald-400">
                                    Réponse correcte : {q.answer}
                                  </div>
                                )}
                             </div>

                             <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                {q.reference ? (
                                   <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 italic">
                                      <Info size={12} /> Ref: {q.reference}
                                   </div>
                                ) : <div />}
                                
                                <div className="flex items-center gap-1 text-[8px] font-black uppercase text-white/10 group-hover:text-admin-accent/40 transition-colors">
                                   AI-Model gpt-4o <ArrowRight size={10} />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>

                    <div className="pt-12 text-center">
                       <p className="text-xs text-white/20 font-bold uppercase tracking-widest flex items-center justify-center gap-4">
                          <span className="w-12 h-[1px] bg-white/5"></span>
                          Fin des suggestions
                          <span className="w-12 h-[1px] bg-white/5"></span>
                       </p>
                    </div>
                 </>
              )}
           </div>

        </div>

      </div>

    </div>
  );
};

export default AIPage;
