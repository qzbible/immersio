import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User as UserIcon, Shield, Mail, Calendar, Key, CheckCircle, Tag, LogOut, ArrowRight, Activity, Building2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const resp = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="w-10 h-10 border-4 border-admin-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-admin-bg text-white">
        Erreur de chargement du profil.
      </div>
    );
  }

  return (
    <div className="flex bg-admin-bg relative min-h-screen text-white">
      <div className="p-12 space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic tracking-tight uppercase">
              Mon Profil
            </h2>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Informations et Autorisations</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-admin-card border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-admin-accent/10 blur-[100px] pointer-events-none rounded-full"></div>
          
          <div className="flex items-center gap-8 relative z-10 mb-12">
             <div className="w-32 h-32 rounded-full border-4 border-admin-accent/20 overflow-hidden bg-admin-sidebar flex items-center justify-center shrink-0">
                {user.picture ? (
                   <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   <UserIcon size={48} className="text-admin-accent/50" />
                )}
             </div>
             <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">{user.name || "Utilisateur Inconnu"}</h3>
                <div className="flex items-center gap-2 mt-2 text-white/50 text-sm font-bold">
                   <Mail size={16} /> {user.email}
                </div>
                <div className="flex gap-2 mt-4">
                   {user.is_admin ? (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1">
                         <Shield size={12}/> Staff Global
                      </span>
                   ) : (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1">
                         <Building2 size={12}/> {user.is_org_owner ? "Propriétaire d'Organisation" : "Membre de l'Organisation"}
                      </span>
                   )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             
             {/* General Info */}
             <div className="space-y-6">
                <h4 className="text-sm font-black text-white/40 uppercase tracking-[3px] flex items-center gap-2">
                   <Activity size={16} /> Identité 
                </h4>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">ID Utilisateur</span>
                      <span className="text-sm font-bold text-white/80">{user.user_id}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">Niveau (Joueur)</span>
                      <span className="text-sm font-bold text-white/80 flex items-center gap-2">Lvl {user.level} • {user.xp} XP</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">Date de création</span>
                      <span className="text-sm font-bold text-white/80">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                   </div>
                </div>
             </div>

             {/* Permissions & Roles */}
             <div className="space-y-6">
                <h4 className="text-sm font-black text-white/40 uppercase tracking-[3px] flex items-center gap-2">
                   <Key size={16} /> Droits & Accès
                </h4>
                <div className="bg-admin-accent/5 border border-admin-accent/20 rounded-3xl p-6 space-y-4">
                   <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                         <CheckCircle size={16} className="text-admin-accent mt-0.5" />
                         <div>
                            <span className="text-xs font-bold text-white/80 uppercase tracking-widest block">Accès Dashboard Admin</span>
                            <span className="text-[10px] text-white/40">Vous pouvez accéder a l'espace de gestion.</span>
                         </div>
                      </li>
                      
                      {user.is_admin && (
                        <li className="flex items-start gap-3">
                           <CheckCircle size={16} className="text-blue-400 mt-0.5" />
                           <div>
                              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">Pouvoirs Modérateur</span>
                              <span className="text-[10px] text-white/40">Gestion de toutes les questions et de la bibliothèque globale.</span>
                           </div>
                        </li>
                      )}

                      {user.is_org_owner && (
                        <li className="flex items-start gap-3">
                           <CheckCircle size={16} className="text-emerald-400 mt-0.5" />
                           <div>
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">Gestion d'Organisation</span>
                              <span className="text-[10px] text-white/40">Vous pouvez inviter des membres et gérer les ressources exclusives à votre organisation.</span>
                           </div>
                        </li>
                      )}
                      
                   </ul>
                </div>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
