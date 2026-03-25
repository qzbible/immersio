import { useState } from 'react';
import axios from 'axios';
import { Sparkles, Send, Database } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const AIPage = () => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('vrai_faux');
  const [lang, setLang] = useState('fr');
  const [num, setNum] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const resp = await axios.post(`${BACKEND_URL}/api/admin/generate`, {
        category,
        topic,
        num_questions: num,
        lang
      }, { withCredentials: true });
      setResults(resp.data.questions);
    } catch (err) {
      alert("Erreur lors de la génération. Vérifiez la clé API LLM.");
    } finally {
      setLoading(false);
    }
  };

  const saveBulk = async () => {
    if (!results.length) return;
    try {
      await axios.post(`${BACKEND_URL}/api/admin/questions/bulk`, { questions: results }, { withCredentials: true });
      alert(`${results.length} questions sauvegardées dans le brouillon !`);
      setResults([]);
    } catch (err) {
      alert("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono tracking-tight underline decoration-admin-accent underline-offset-8">Générateur de Questions par IA</h2>
          <p className="text-white/40 text-sm mt-4 italic font-serif">"Toute l'Écriture est inspirée de Dieu, et utile pour enseigner..." - 2 Timothée 3:16</p>
        </div>
        <div className="p-4 rounded-full bg-admin-accent/10 text-admin-accent animate-pulse">
            <Sparkles size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Options */}
        <div className="bg-admin-card rounded-2xl border border-white/5 p-6 h-fit space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Paramètres</h3>
            
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs text-white/40 uppercase">Thème biblique</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Les paraboles de Jésus, L'Exode..." 
                      className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-white/40 uppercase">Type de jeu</label>
                    <select 
                      className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="vrai_faux">Vrai ou Faux</option>
                        <option value="qui_a_dit">Qui a dit ?</option>
                        <option value="chrono_versets">Complète le Verset</option>
                        <option value="anagrammes">Anagrammes</option>
                    </select>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-white/40 uppercase">Langue</label>
                        <select 
                          className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                          value={lang}
                          onChange={(e) => setLang(e.target.value)}
                        >
                            <option value="fr">🇫🇷 Français</option>
                            <option value="en">🇺🇸 Anglais</option>
                            <option value="both">🌍 Les deux</option>
                        </select>
                    </div>
                    <div className="w-24 space-y-1">
                        <label className="text-xs text-white/40 uppercase">Nombre</label>
                        <input 
                          type="number" 
                          className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                          value={num}
                          min={1} max={10}
                          onChange={(e) => setNum(parseInt(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-admin-accent to-fuchsia-400 hover:from-admin-accent/80 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Génération en cours..." : "Générer les Questions"}
              {!loading && <Send size={18} />}
            </button>
        </div>

        {/* Panel Results */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Résultats ({results.length})</h3>
                {results.length > 0 && (
                    <button 
                      onClick={saveBulk}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all"
                    >
                        <Database size={14} /> Sauvegarder tout
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {results.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-2xl text-white/20 italic">
                        Configurez les options et lancez la génération...
                    </div>
                ) : results.map((r, i) => (
                    <div key={i} className="bg-admin-card border border-white/5 rounded-2xl p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 italic text-[10px] text-admin-accent">AI SUGGESTION</div>
                        <div className="text-xs text-admin-accent font-bold mb-2 uppercase tracking-widest">{r.category}</div>
                        <p className="text-white font-medium mb-4">{r.text}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                           <span className="px-2 py-1 rounded bg-admin-accent/10 text-admin-accent border border-admin-accent/20">Réponse: {String(r.answer)}</span>
                           {r.reference && <span className="px-2 py-1 rounded bg-white/5 text-white/40 italic">Réf: {r.reference}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
