import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const resp = await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email });
      setMessage({ type: 'success', text: resp.data.message });
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
            <h1 className="text-2xl font-bold text-white mb-2">Mot de passe oublié ?</h1>
            <p className="text-white/40 text-sm">Entrez votre email pour recevoir un code de réinitialisation.</p>
          </div>

          {message.type === 'success' ? (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center text-green-500">
                <CheckCircle size={64} />
              </div>
              <p className="text-white/80">{message.text}</p>
              <div className="pt-4">
                 <Link 
                  to={`/reset-password?email=${email}`}
                  className="w-full bg-admin-accent hover:bg-admin-accent/80 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Saisir le code
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="votre@email.com"
                    className="w-full bg-admin-bg border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-admin-accent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {message.type === 'error' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {message.text}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-admin-accent hover:bg-admin-accent/80 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-admin-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Envoyer le code"}
                <Send size={18} />
              </button>
            </form>
          )}

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

export default ForgotPassword;
