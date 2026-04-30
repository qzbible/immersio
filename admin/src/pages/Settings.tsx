import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Key } from 'lucide-react';
import { toast } from '../components/Toaster';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const Settings = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${BACKEND_URL}/api/auth/change-password`, {
                old_password: oldPassword,
                new_password: newPassword
            }, { withCredentials: true });

            toast.success('Mot de passe mis à jour avec succès !');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Shield className="text-admin-accent" />
                    Paramètres de sécurité
                </h2>
                <p className="text-white/40 text-sm">Gérez vos identifiants d'accès à l'administration.</p>
            </div>

            <div className="bg-admin-card rounded-2xl border border-white/5 p-8 shadow-xl">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Key size={20} className="text-admin-accent" />
                    Modifier le mot de passe
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Ancien mot de passe</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-admin-accent/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-admin-accent/50 transition-all"
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">Confirmer le nouveau passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-admin-accent/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-admin-accent hover:bg-admin-accent/80 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-admin-accent/20 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
