import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import { toast } from '../components/Toaster';
import ConfirmModal from '../components/ConfirmModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/users?search=${search}`, { withCredentials: true });
      setUsers(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = (email: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Promouvoir Admin ?",
      message: `Voulez-vous vraiment accorder les droits d'administration à ${email} ?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await axios.post(`${BACKEND_URL}/api/admin/promote`, { email }, { withCredentials: true });
          toast.success("Utilisateur promu !");
          fetchUsers();
        } catch (err) {
          toast.error("Erreur lors de la promotion");
        }
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Supprimer l'utilisateur ?",
      message: `Voulez-vous supprimer définitivement ${name} ? Cette action est irréversible.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`${BACKEND_URL}/api/admin/users/${id}`, { withCredentials: true });
          setUsers(users.filter(u => u.user_id !== id));
          toast.success("Utilisateur supprimé");
        } catch (err) {
          toast.error("Impossible de supprimer cet utilisateur");
        }
      }
    });
  };

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Gestion Utilisateurs</h2>
          <p className="text-white/40 text-sm">Gérez les comptes et les accès de la plateforme.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un nom ou email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-admin-card border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-admin-accent transition-all w-80"
          />
        </div>
      </div>

      <div className="bg-admin-card rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Utilisateur</th>
              <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Church / Eglise</th>
              <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Niveau / XP</th>
              <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-white/40">Chargement...</td></tr>
            ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-white/40">Aucun utilisateur trouvé</td></tr>
            ) : users.map((u) => (
              <tr key={u.user_id} className="hover:bg-white/5 transition-all group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.picture || '/default_avatar.png'} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1">
                        {u.name}
                        {u.is_admin && <Shield size={14} className="text-admin-accent" />}
                      </div>
                      <div className="text-xs text-white/40 flex items-center gap-1">
                        <Mail size={12} /> {u.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {u.church || "Non renseigné"}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-white">Lvl {u.level || 1}</div>
                  <div className="text-xs text-white/40">{u.xp || 0} XP</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!u.is_admin && (
                        <button 
                            onClick={() => handlePromote(u.email)}
                            className="p-2 rounded-lg bg-admin-accent/10 text-admin-accent hover:bg-admin-accent hover:text-white transition-all"
                            title="Promouvoir Admin"
                        >
                        <Shield size={16} />
                        </button>
                    )}
                    <button 
                        onClick={() => handleDelete(u.user_id, u.name)}
                        className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400 hover:text-white transition-all"
                        title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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

export default UsersPage;
