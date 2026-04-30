import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileUp,
  CheckCircle2,
  AlertCircle,
  Upload,
  Table as TableIcon,
  Eye,
  Loader2,
  ChevronRight,
  Send,
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from '../components/Toaster';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const EXAM_DOMAINS = [
  'Cloud & DevOps', 'Cybersécurité', 'Développement', 'Réseaux',
  'Intelligence Artificielle', 'Bases de données', 'Administration Système',
  'Gestion de Projet', 'Bible & Théologie', 'Autre',
];

/* ─── Toggle Component ─────────────────────────────────────── */
const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div onClick={onToggle} className={`w-10 h-5 rounded-full transition-colors relative ${on ? 'bg-admin-accent' : 'bg-white/20'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
    <span className="text-sm text-white/70">{label}</span>
  </label>
);

/* ─── Exam Management Panel ────────────────────────────────── */
const ExamManagementPanel = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const empty = { name: '', description: '', domain: '', objectives: '', question_count: 20, theme_count: 5, is_official: true, available: true };
  const [form, setForm] = useState(empty);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Try the admin exams endpoint first, fallback to certifications
      let res;
      try {
        res = await axios.get(`${BACKEND_URL}/api/admin/exams`, { withCredentials: true });
      } catch {
        res = await axios.get(`${BACKEND_URL}/api/certifications`, { withCredentials: true });
      }
      setExams(res.data || []);
    } catch { toast.error('Impossible de charger les examens'); }
    setLoading(false);
  };

  const getId = (e: any) => e.exam_id || e.mode_id || e.cert_id;

  const handleToggle = async (exam: any) => {
    const id = getId(exam);
    const endpoint = exam.exam_id
      ? `${BACKEND_URL}/api/admin/exams/${id}/publish`
      : `${BACKEND_URL}/api/certifications/${id}`;
    const payload = exam.exam_id ? { is_published: !exam.is_published } : { available: !exam.available };
    try {
      await axios.patch(endpoint, payload, { withCredentials: true });
      setExams(prev => prev.map(e => getId(e) === id ? { ...e, ...payload } : e));
      toast.success(exam.is_published || exam.available ? 'Examen dépublié' : 'Examen publié !');
    } catch { toast.error('Erreur lors de la modification'); }
  };

  const handleDelete = async (exam: any) => {
    if (!confirm(`Supprimer "${exam.name}" ?`)) return;
    const id = getId(exam);
    try {
      await axios.delete(`${BACKEND_URL}/api/certifications/${id}`, { withCredentials: true });
    } catch {}
    setExams(prev => prev.filter(e => getId(e) !== id));
    toast.success('Examen supprimé');
  };

  const handleEdit = (exam: any) => {
    setForm({ name: exam.name || '', description: exam.description || '', domain: exam.domain || exam.category || '', objectives: exam.objectives || '', question_count: exam.question_count || 20, theme_count: exam.theme_count || 5, is_official: exam.is_official !== false, available: exam.available !== false });
    setEditingId(getId(exam));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await axios.patch(`${BACKEND_URL}/api/certifications/${editingId}`, { ...form, owner_id: 'system' }, { withCredentials: true });
        setExams(prev => prev.map(e => getId(e) === editingId ? { ...e, ...form } : e));
        toast.success('Examen mis à jour !');
      } else {
        const res = await axios.post(`${BACKEND_URL}/api/certifications`, { ...form, owner_id: 'system' }, { withCredentials: true });
        setExams(prev => [...prev, res.data]);
        toast.success('Examen créé et publié !');
      }
      setForm(empty); setEditingId(null); setShowForm(false);
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Erreur'); }
    setSaving(false);
  };

  const isPublished = (e: any) => e.is_published !== false && e.available !== false;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { val: exams.length, label: 'Total examens', cls: 'text-admin-accent' },
          { val: exams.filter(isPublished).length, label: 'Publiés', cls: 'text-green-400' },
          { val: exams.filter(e => !isPublished(e)).length, label: 'Brouillons', cls: 'text-white/40' },
        ].map(s => (
          <div key={s.label} className="bg-admin-card border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${s.cls}`}>{s.val}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <GraduationCap size={20} className="text-admin-accent" /> Gestion des Examens
        </h2>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-admin-accent text-admin-bg hover:opacity-90 transition-opacity">
            <Plus size={16} /> Nouvel examen
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-admin-card border border-admin-accent/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Edit3 size={16} className="text-admin-accent" />
              {editingId ? "Modifier l'examen" : 'Créer un nouvel examen'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-bold uppercase tracking-wider">Nom *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ex: AWS Solutions Architect"
                className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-admin-accent/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-bold uppercase tracking-wider">Domaine</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-admin-accent/50 appearance-none">
                <option value="">Sélectionner...</option>
                {EXAM_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-white/40 text-xs mb-1.5 block font-bold uppercase tracking-wider">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez l'examen..." rows={3}
                className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-admin-accent/50 resize-none" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1.5 block font-bold uppercase tracking-wider">Objectifs</label>
              <input value={form.objectives} onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))}
                placeholder="ex: Maîtriser les services AWS"
                className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-admin-accent/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/40 text-xs mb-1.5 block font-bold uppercase tracking-wider">Nb questions</label>
                <input type="number" min={5} max={500} value={form.question_count}
                  onChange={e => setForm(f => ({ ...f, question_count: parseInt(e.target.value) || 20 }))}
                  className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-admin-accent/50" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1.5 block font-bold uppercase tracking-wider">Nb thèmes</label>
                <input type="number" min={1} max={50} value={form.theme_count}
                  onChange={e => setForm(f => ({ ...f, theme_count: parseInt(e.target.value) || 5 }))}
                  className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-admin-accent/50" />
              </div>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-5">
              <Toggle on={form.is_official} onToggle={() => setForm(f => ({ ...f, is_official: !f.is_official }))} label='Badge "Certifié Admin"' />
              <Toggle on={form.available} onToggle={() => setForm(f => ({ ...f, available: !f.available }))} label='Publié (visible aux utilisateurs)' />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-admin-accent text-admin-bg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingId ? 'Mettre à jour' : "Publier l'examen"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-white/50 hover:bg-white/10 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-12 flex items-center justify-center text-white/30"><Loader2 className="animate-spin" /></div>
      ) : exams.length === 0 ? (
        <div className="bg-admin-card border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <GraduationCap size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Aucun examen. Créez-en un ou importez via Excel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => {
            const id = getId(exam);
            const published = isPublished(exam);
            return (
              <div key={id} className="bg-admin-card border border-white/5 hover:border-white/10 rounded-xl p-4 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-admin-accent/10 border border-admin-accent/20 flex items-center justify-center shrink-0">
                      <GraduationCap size={20} className="text-admin-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-white font-bold text-sm">{exam.name}</h4>
                        {exam.is_official && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-admin-accent/10 text-admin-accent border border-admin-accent/20">Certifié Admin</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${published ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                          {published ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                      <p className="text-white/30 text-xs mt-0.5 line-clamp-1">
                        {exam.domain || exam.category || '—'} · {exam.question_count || '?'} questions · {exam.theme_count || '?'} thèmes
                      </p>
                      {exam.description && <p className="text-white/20 text-xs mt-1 line-clamp-1">{exam.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(exam)} title={published ? 'Dépublier' : 'Publier'}
                      className={`p-2 rounded-lg transition-colors ${published ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'}`}>
                      <Send size={14} />
                    </button>
                    <button onClick={() => handleEdit(exam)} title="Modifier"
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(exam)} title="Supprimer"
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Import Excel Panel ───────────────────────────────────── */
const ImportExcelPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/exams`, { withCredentials: true });
      setExams(response.data);
    } catch { toast.error('Erreur lors de la récupération des examens'); }
    setLoadingExams(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/exams/import`, formData, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(response.data.message);
      setFile(null); fetchExams();
    } catch (error: any) { toast.error(error.response?.data?.detail || "Échec de l'importation"); }
    setIsUploading(false);
  };

  const togglePublish = async (exam_id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/admin/exams/${exam_id}/publish`, { is_published: !currentStatus }, { withCredentials: true });
      toast.success(currentStatus ? 'Examen retiré' : 'Examen publié');
      setExams(exams.map(e => e.exam_id === exam_id ? { ...e, is_published: !currentStatus } : e));
    } catch { toast.error('Erreur lors de la modification'); }
  };

  const viewQuestions = async (exam_id: string) => {
    setSelectedExamId(exam_id);
    setLoadingQuestions(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/exams/${exam_id}/questions`, { withCredentials: true });
      setExamQuestions(response.data);
    } catch { toast.error('Erreur lors de la récupération des questions'); }
    setLoadingQuestions(false);
  };

  return (
    <div className="space-y-8">
      {/* Upload */}
      <div className="bg-admin-card border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed transition-all ${file ? 'border-admin-accent bg-admin-accent/10' : 'border-white/10 bg-white/5'}`}>
          {file ? <CheckCircle2 size={32} className="text-admin-accent" /> : <FileUp size={32} className="text-white/20" />}
        </div>
        <div className="max-w-xs">
          <h3 className="text-lg font-bold text-white mb-1">{file ? file.name : 'Sélectionner un fichier'}</h3>
          <p className="text-xs text-white/40">Glissez-déposez votre fichier Excel ou cliquez pour parcourir.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all">
            <input type="file" className="hidden" accept=".xlsx" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            {file ? 'Changer le fichier' : 'Parcourir'}
          </label>
          {file && (
            <button onClick={handleUpload} disabled={isUploading}
              className="bg-admin-accent hover:opacity-90 px-6 py-2.5 rounded-xl text-sm font-black text-admin-bg uppercase tracking-wide flex items-center gap-2 transition-all disabled:opacity-50">
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Importer Maintenant
            </button>
          )}
        </div>
      </div>

      {/* Exams + Preview */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TableIcon size={18} className="text-admin-accent" /> Vos Examens
            </h2>
            <button onClick={fetchExams} className="text-xs text-admin-accent hover:underline">Rafraîchir</button>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {loadingExams ? (
              <div className="flex items-center justify-center py-10 opacity-50"><Loader2 className="animate-spin" /></div>
            ) : exams.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-xs text-white/30 italic">Aucun examen importé</p>
              </div>
            ) : exams.map(exam => (
              <div key={exam.exam_id} onClick={() => viewQuestions(exam.exam_id)}
                className={`group p-4 rounded-xl border transition-all cursor-pointer ${selectedExamId === exam.exam_id ? 'bg-admin-accent/10 border-admin-accent/30' : 'bg-admin-card border-white/5 hover:border-white/10'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="text-sm font-bold text-white truncate">{exam.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 uppercase font-black">{exam.exam_id}</span>
                      <span className="text-[10px] text-white/30">{exam.question_count} questions</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); togglePublish(exam.exam_id, exam.is_published); }}
                    className={`p-1.5 rounded-lg transition-all ${exam.is_published ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                    <Send size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span className={`text-[10px] font-black uppercase ${exam.is_published ? 'text-green-400' : 'text-white/20'}`}>{exam.is_published ? 'Publié' : 'Brouillon'}</span>
                  <ChevronRight size={14} className={`transition-all ${selectedExamId === exam.exam_id ? 'translate-x-1 text-admin-accent' : 'text-white/10'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedExamId ? (
            <div className="h-[600px] bg-admin-card border border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"><Eye size={32} className="text-white/10" /></div>
              <h3 className="text-lg font-bold text-white mb-2">Aperçu des questions</h3>
              <p className="text-sm text-white/30 max-w-sm">Sélectionnez un examen pour prévisualiser ses questions.</p>
            </div>
          ) : (
            <div className="bg-admin-card border border-white/5 rounded-2xl flex flex-col h-[600px]">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-admin-accent"></span>
                  Questions : {exams.find(e => e.exam_id === selectedExamId)?.name}
                </h3>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{examQuestions.length} Questions</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingQuestions ? (
                  <div className="flex items-center justify-center h-full opacity-50"><Loader2 className="animate-spin" /></div>
                ) : examQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-admin-accent/20 text-admin-accent uppercase">{q.type}</span>
                        <span className="text-[10px] text-white/40">ID: {q.question_id}</span>
                      </div>
                      <span className="text-[10px] font-black text-white/20 uppercase">#{idx + 1}</span>
                    </div>
                    <p className="text-sm text-white font-medium leading-relaxed">{q.text}</p>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className={`text-xs p-2 rounded-lg border ${q.answer === oIdx || (Array.isArray(q.answer) && q.answer.includes(oIdx)) ? 'bg-admin-accent/10 border-admin-accent/20 text-admin-accent' : 'bg-black/20 border-white/5 text-white/40'}`}>{opt}</div>
                        ))}
                      </div>
                    )}
                    {(q.type === 'short_answer' || q.type === 'true_false') && (
                      <div className="p-2 rounded-lg bg-admin-accent/10 border border-admin-accent/20">
                        <p className="text-[10px] font-bold text-admin-accent uppercase mb-1">Bonne Réponse</p>
                        <p className="text-xs text-white">{String(q.answer)}</p>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] font-bold text-white/30 uppercase mb-1 italic">Explication</p>
                        <p className="text-xs text-white/50 leading-relaxed italic">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */
const ImportExams = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'import'>('manage');

  const TABS = [
    { id: 'manage', label: 'Gestion des Examens', icon: GraduationCap },
    { id: 'import', label: 'Import Excel', icon: FileUp },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Examens & Certifications</h1>
          <p className="text-white/40 text-sm">Gérez vos examens, publiez des certifications et importez des banques de questions.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-admin-accent/10 border border-admin-accent/20 rounded-lg">
          <AlertCircle size={16} className="text-admin-accent" />
          <span className="text-xs font-medium text-admin-accent">Import : Format Excel (.xlsx)</span>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="border-b border-white/10">
        <div className="flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-admin-accent text-admin-accent' : 'border-transparent text-white/40 hover:text-white'}`}>
                <Icon size={16} />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'manage' && <ExamManagementPanel />}
      {activeTab === 'import' && <ImportExcelPanel />}
    </div>
  );
};

export default ImportExams;
