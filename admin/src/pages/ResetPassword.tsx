import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Hash, CheckCircle, ArrowLeft } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [email] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Les mots de passe ne correspondent pas" });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        email,
        code,
        new_password: newPassword
      });
      setMessage({ type: 'success', text: "Mot de passe réinitialisé ! Redirection..." });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Une erreur est survenue" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="bg-admin-card border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Réinitialisation</h1>
            <p className="text-white/40 text-sm">Entrez le code reçu par email pour définir votre nouveau mot de passe.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                readOnly
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 focus:outline-none cursor-not-allowed"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Code de validation</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all tracking-widest text-center text-xl font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

               <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Confirmer</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'
              } border ${message.type === 'success' ? 'border-green-500/20' : 'border-red-500/20'} text-sm`}>
                {message.type === 'success' && <CheckCircle size={18} />}
                {message.text}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-admin-accent hover:bg-admin-accent/80 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Traitement..." : "Réinitialiser mon mot de passe"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
