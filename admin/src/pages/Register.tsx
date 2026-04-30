import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Lock, Mail, ArrowRight, User } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/staff/register`, { name, email, password }, { withCredentials: true });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-2xl bg-admin-accent/10 text-admin-accent mb-4">
            <UserPlus size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">Créer un compte Staff</h1>
          <p className="text-white/40 mt-2">Rejoignez l'équipe d'administration BibleQuest</p>
        </div>

        <div className="bg-admin-card border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Nom Complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Jean Dupont"
                  className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Email Professionnel</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="nom@biblequest.com"
                  className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-admin-accent hover:bg-admin-accent/80 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-admin-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer mon compte"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
             <p className="text-sm text-white/40">Déjà un compte ? <Link to="/login" className="text-admin-accent hover:underline">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
