import React, { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import {
  Search, Filter, Plus, Edit2, Trash2, CheckCircle,
  AlertCircle, X, ListOrdered, Play
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const CATEGORIES = [
  "quiz_vrai_faux",
  "quiz_qui_a_dit",
  "chrono_versets",
  "anagrammes",
  "labyrinthe_exode",
  "blind_test",
  "voyage_paul",
  "general_quiz",
  "memory_biblique", // Just in case we want to customize pairs
  "vrai_faux", // Support legacy
  "qui_a_dit", // Support legacy
];

const CATEGORY_LABELS: Record<string, string> = {
  "quiz_vrai_faux": "Quiz Vrai/Faux",
  "quiz_qui_a_dit": "Quiz Qui a dit",
  "chrono_versets": "Complétez le verset (Chrono)",
  "anagrammes": "Anagrammes Bibliques",
  "labyrinthe_exode": "Labyrinthe de l'Exode",
  "blind_test": "Blind Test des Cantiques",
  "voyage_paul": "Le Voyage de Paul",
  "general_quiz": "Quiz Général (Campagne)",
  "memory_biblique": "Memory Biblique",
  "vrai_faux": "Vrai ou Faux (Legacy)",
  "qui_a_dit": "Qui a dit ? (Legacy)",
};

const DIFFICULTIES = [
  { value: "très faible", label: "Très faible" },
  { value: "faible", label: "Faible" },
  { value: "moyen", label: "Moyen" },
  { value: "un peu audessus de la moyen", label: "Un peu au-dessus de la moyenne" },
  { value: "fort", label: "Fort" },
  { value: "tres fort", label: "Très fort" },
];

const JeuxPageInner = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(searchParams.get('category') || '');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    category: 'quiz_vrai_faux',
    lang: 'fr',
    difficulty: 'moyen',
    text: '',
    answer: '',
    options: ['', '', '', ''],
    reference: '',
    approved: true,
    book: ''
  });

  useEffect(() => {
    fetchItems();
  }, [filterCat, search, filterDifficulty]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterCat) params.category = filterCat;
      if (search) params.search = search;
      if (filterDifficulty) params.difficulty = filterDifficulty;

      const resp = await axios.get(`${BACKEND_URL}/api/admin/questions`, {
        params,
        withCredentials: true
      });
      setItems(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error("Error fetching items:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce jeu ?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/questions/${id}`, { withCredentials: true });
      setItems(items.filter(q => q.question_id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleApprove = async (q: any) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/admin/questions/${q.question_id}`, {
        approved: !q.approved
      }, { withCredentials: true });
      setItems(items.map(item =>
        item.question_id === q.question_id ? { ...item, approved: !item.approved } : item
      ));
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleOpenModal = (q: any = null) => {
    if (q) {
      setEditingItem(q);
      setFormData({
        ...q,
        answer: typeof q.answer === 'number' ? q.answer.toString() : q.answer,
        options: q.options || ['', '', '', '']
      });
    } else {
      setEditingItem(null);
      setFormData({
        category: filterCat || 'vrai_faux',
        lang: 'fr',
        difficulty: filterDifficulty || 'moyen',
        text: '',
        answer: '',
        options: ['', '', '', ''],
        reference: '',
        approved: true,
        book: ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isQuizType = [
        'quiz_qui_a_dit', 'quiz_vrai_faux', 'qui_a_dit', 'vrai_faux', 'labyrinthe_exode'
      ].includes(formData.category);

      const payload = {
        ...formData,
        answer: isQuizType
          ? parseInt(formData.answer || '0')
          : formData.answer
      };

      if (editingItem) {
        await axios.patch(`${BACKEND_URL}/api/admin/questions/${editingItem.question_id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/questions`, payload, { withCredentials: true });
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Gestion des Jeux</h2>
          <p className="text-white/40 text-sm">Gérez les questions et le contenu de BibleQuest.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-admin-accent hover:bg-admin-accent/80 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-admin-accent/20"
        >
          <Plus size={20} /> Nouveau Jeu
        </button>
      </div>

      <div className="bg-admin-card border border-white/5 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            type="text"
            placeholder="Rechercher par texte..."
            className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-white/20" />
          <select
            className="bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-admin-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">Contenu (Jeu)</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">Difficulté</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider text-center">Langue</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">Chargement des données...</td>
              </tr>
            ) : (!Array.isArray(items) || items.length === 0) ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">Aucun jeu trouvé</td>
              </tr>
            ) : items.map((q) => (
              <tr key={q.question_id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-white font-medium line-clamp-2">{q.text}</p>
                    {q.reference && <p className="text-[10px] text-admin-accent italic flex items-center gap-1"><ListOrdered size={10} /> {q.reference}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-white/5">
                    {CATEGORY_LABELS[q.category] || q.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] text-white/60 bg-white/5 px-2 py-1 rounded-md font-bold tracking-wider border border-white/5">
                    {DIFFICULTIES.find(d => d.value === q.difficulty)?.label || q.difficulty || "Moyen"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-[10px] uppercase text-white/40 font-black border border-white/10 px-1.5 py-0.5 rounded">{q.lang}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleApprove(q)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold transition-all border ${q.approved
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}
                  >
                    {q.approved ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {q.approved ? 'APPROUVÉ' : 'EN ATTENTE'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/play/${q.category}`)}
                      className="p-2 text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Tester cette catégorie"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(q)}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.question_id)}
                      className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-bg/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-admin-card border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white">{editingItem ? 'Modifier le Jeu' : 'Ajouter un Jeu'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white p-1 hover:bg-white/5 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Catégorie</label>
                  <select
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Langue</label>
                  <select
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent transition-all"
                    value={formData.lang}
                    onChange={(e) => setFormData({ ...formData, lang: e.target.value })}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Texte / Question</label>
                <textarea
                  required
                  className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent h-24 transition-all resize-none"
                  placeholder="Entrez le contenu pédagogique..."
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Référence Biblique</label>
                <input
                  type="text"
                  className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent transition-all"
                  placeholder="ex: Jean 3:16"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              {(formData.category === 'quiz_vrai_faux' || formData.category === 'vrai_faux') ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Réponse Correcte</label>
                  <select
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  >
                    <option value="">Choisir...</option>
                    <option value="0">Vrai</option>
                    <option value="1">Faux</option>
                  </select>
                </div>
              ) : (formData.category === 'quiz_qui_a_dit' || formData.category === 'qui_a_dit' || formData.category === 'labyrinthe_exode') ? (
                <div className="space-y-4">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Options et Réponse</label>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct_answer"
                          className="w-4 h-4 text-admin-accent bg-admin-bg border-white/10 border"
                          checked={formData.answer === i.toString()}
                          onChange={() => setFormData({ ...formData, answer: i.toString() })}
                        />
                        <input
                          type="text"
                          className="flex-1 bg-admin-bg border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-admin-accent"
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[i] = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Réponse Attendue</label>
                  <input
                    type="text"
                    className="w-full bg-admin-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-admin-accent"
                    placeholder="Réponse exacte..."
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  />
                </div>
              )}

              <div className="pt-6 border-t border-white/5 flex gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-xl bg-admin-accent text-white font-bold shadow-lg shadow-admin-accent/20 hover:bg-admin-accent/80 transition-all uppercase tracking-widest text-xs"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const JeuxPage = () => {
  return (
    <Suspense fallback={<div className="p-8 text-white/40">Chargement...</div>}>
      <JeuxPageInner />
    </Suspense>
  );
};

export default JeuxPage;
