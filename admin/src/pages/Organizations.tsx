import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOrganization } from '../hooks/useOrganization';
import {
  Building2, Plus, UserPlus, Trash2, Mail, Shield, User,
  Users, Globe, CheckCircle, XCircle, Clock, Send, AtSign
} from 'lucide-react';
import { toast } from '../components/Toaster';
import ConfirmModal from '../components/ConfirmModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const Organizations = () => {
  const { organizations, activeOrgId, switchOrg, refreshOrgs, isPersonal, isSystem, isOwner } = useOrganization();
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteValue, setInviteValue] = useState('');          // email or username
  const [inviteMode, setInviteMode] = useState<'email' | 'username'>('email');
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  const activeOrg = organizations.find(o => o.org_id === activeOrgId);

  /* ── Fetch pending invitations for current user ── */
  const fetchInvitations = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/invitations`, { withCredentials: true });
      setPendingInvites(resp.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchInvitations(); }, []);

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  /* ── Create Org ── */
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setLoading(true);
    try {
      const resp = await axios.post(`${BACKEND_URL}/api/orgs/`, { name: newOrgName }, { withCredentials: true });
      toast.success('Organisation créée !');
      setNewOrgName('');
      await refreshOrgs();
      switchOrg(resp.data.org_id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  /* ── Invite member ── */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !inviteValue.trim()) return;
    setLoading(true);
    try {
      const body = inviteMode === 'email'
        ? { email: inviteValue.trim() }
        : { username: inviteValue.trim() };
      const resp = await axios.post(
        `${BACKEND_URL}/api/admin/orgs/${activeOrgId}/invite`,
        body,
        { withCredentials: true }
      );
      toast.success(resp.data.message);
      setInviteValue('');
      await refreshOrgs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'invitation");
    } finally { setLoading(false); }
  };

  /* ── Accept invite ── */
  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/admin/invitations/${invitationId}/accept`, {}, { withCredentials: true });
      toast.success("Invitation acceptée !");
      await fetchInvitations();
      await refreshOrgs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  /* ── Decline invite ── */
  const handleDeclineInvite = async (invitationId: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/admin/invitations/${invitationId}/decline`, {}, { withCredentials: true });
      setPendingInvites(prev => prev.filter(i => i.invitation_id !== invitationId));
    } catch { /* silent */ }
  };

  /* ── Remove member ── */
  const handleRemoveMember = (userId: string) => {
    if (!activeOrgId) return;
    setConfirmConfig({
      isOpen: true,
      title: "Retirer le membre ?",
      message: "Cet utilisateur n'aura plus accès aux ressources de l'organisation.",
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`${BACKEND_URL}/api/orgs/${activeOrgId}/members/${userId}`, { withCredentials: true });
          toast.success("Membre retiré");
          await refreshOrgs();
        } catch (err: any) {
          toast.error(err.response?.data?.detail || 'Erreur');
        }
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Building2 className="text-admin-accent" size={30} />
          Organisations
        </h1>
        <p className="text-white/40 text-sm">Gérez vos équipes et invitez des collaborateurs.</p>
      </div>


      {/* Pending invitations banner (shown when user has pending invites) */}
      {pendingInvites.length > 0 && (
        <div className="bg-admin-accent/10 border border-admin-accent/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-admin-accent font-bold text-sm uppercase tracking-wider">
            <Clock size={16} /> {pendingInvites.length} Invitation(s) en attente
          </div>
          {pendingInvites.map(inv => (
            <div key={inv.invitation_id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 gap-4">
              <div>
                <p className="text-white font-bold text-sm">{inv.org_name}</p>
                <p className="text-white/40 text-xs">Invité par {inv.inviter_name}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAcceptInvite(inv.invitation_id)}
                  className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  <CheckCircle size={14} /> Accepter
                </button>
                <button
                  onClick={() => handleDeclineInvite(inv.invitation_id)}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  <XCircle size={14} /> Décliner
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT – org list + creator */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-admin-card border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">Mes Organisations</h2>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{organizations.length}</span>
            </div>

            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
              {organizations.map(org => (
                <button
                  key={org.org_id}
                  onClick={() => switchOrg(org.org_id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    activeOrgId === org.org_id
                      ? 'bg-admin-accent/20 text-admin-accent font-bold ring-1 ring-admin-accent/30'
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    activeOrgId === org.org_id ? 'bg-admin-accent text-admin-bg' : 'bg-white/10'
                  }`}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{org.name}</span>
                </button>
              ))}
              {organizations.length === 0 && (
                <p className="text-center text-white/20 text-xs py-4">Aucune organisation</p>
              )}
            </div>

            {/* Create new org */}
            <div className="p-4 bg-white/5 border-t border-white/5">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-3">Créer une organisation</p>
              <form onSubmit={handleCreateOrg} className="space-y-2">
                <input
                  type="text"
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  placeholder="Nom de l'organisation..."
                  className="w-full bg-admin-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
                <button
                  disabled={loading || !newOrgName.trim()}
                  className="w-full bg-admin-accent hover:bg-admin-accent/90 disabled:opacity-40 text-admin-bg font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <Plus size={15} /> Nouvelle Org
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT – detail panel */}
        <div className="lg:col-span-2 space-y-6">
          {isSystem ? (
            /* ── Platform library ── */
            <div className="bg-admin-card border border-white/5 rounded-2xl p-12 text-center space-y-4 ring-1 ring-purple-500/20">
              <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto">
                <Globe size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white">Bibliothèque de la Plateforme</h2>
              <p className="text-white/40 max-w-md mx-auto text-sm">
                Espace global accessible à tous. Seuls les administrateurs plateforme (Staff) peuvent modifier ce contenu.
              </p>
            </div>
          ) : isPersonal || !activeOrg ? (
            /* ── Personal / no selection ── */
            <div className="bg-admin-card border border-white/5 rounded-2xl p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <User size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white">Mon Espace Personnel</h2>
              <p className="text-white/40 max-w-md mx-auto text-sm">
                Votre espace individuel privé. Créez une organisation pour collaborer avec votre équipe.
              </p>
            </div>
          ) : (
            /* ── Org detail ── */
            <>
              {/* Org header */}
              <div className="bg-admin-card border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-admin-accent/5 rounded-bl-full pointer-events-none" />
                <div className="w-20 h-20 bg-admin-bg border-2 border-admin-accent/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                  🏢
                </div>
                <div className="flex-1 text-center md:text-left space-y-1">
                  <h2 className="text-2xl font-bold text-white">{activeOrg?.name}</h2>
                  <p className="text-white/30 text-xs font-mono">{activeOrg?.org_id}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      <Users size={13} className="text-admin-accent" />
                      {activeOrg?.members?.length || 0} membres
                    </span>
                    {isOwner && (
                      <span className="flex items-center gap-1.5 text-xs text-admin-accent bg-admin-accent/10 px-2 py-1 rounded-md border border-admin-accent/20">
                        <Shield size={13} /> Propriétaire
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Invite section (owner only) */}
              {isOwner && (
                <div className="bg-admin-card border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-white/5 bg-white/5 flex items-center gap-3">
                    <Send className="text-admin-accent" size={18} />
                    <h3 className="font-bold text-white text-sm">Inviter un membre</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Toggle email/username */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setInviteMode('email')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          inviteMode === 'email' ? 'bg-admin-accent text-admin-bg' : 'bg-white/5 text-white/40 hover:text-white'
                        }`}
                      >
                        <Mail size={13} /> Email
                      </button>
                      <button
                        onClick={() => setInviteMode('username')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          inviteMode === 'username' ? 'bg-admin-accent text-admin-bg' : 'bg-white/5 text-white/40 hover:text-white'
                        }`}
                      >
                        <AtSign size={13} /> Username
                      </button>
                    </div>

                    <form onSubmit={handleInvite} className="flex gap-3">
                      <div className="relative flex-1">
                        {inviteMode === 'email'
                          ? <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                          : <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        }
                        <input
                          type={inviteMode === 'email' ? 'email' : 'text'}
                          value={inviteValue}
                          onChange={e => setInviteValue(e.target.value)}
                          placeholder={inviteMode === 'email' ? 'pastor@church.com' : 'nom_utilisateur'}
                          className="w-full bg-admin-bg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent/50 transition-all"
                        />
                      </div>
                      <button
                        disabled={loading || !inviteValue.trim()}
                        className="bg-admin-accent hover:bg-admin-accent/90 disabled:opacity-40 text-admin-bg font-bold px-5 rounded-xl transition-all shadow-lg shadow-admin-accent/10 text-sm whitespace-nowrap"
                      >
                        Inviter
                      </button>
                    </form>

                    <p className="text-[11px] text-white/30 italic">
                      Si l'utilisateur existe, il est ajouté directement. Sinon, une invitation en attente est créée.
                    </p>
                  </div>
                </div>
              )}

              {/* Members list */}
              <div className="bg-admin-card border border-white/5 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-5 border-b border-white/5 bg-white/5 flex items-center gap-3">
                  <UserPlus className="text-admin-accent" size={18} />
                  <h3 className="font-bold text-white text-sm">Membres de l'équipe</h3>
                  <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">{activeOrg?.members?.length || 0}</span>
                </div>
                <div className="p-4 space-y-2">
                  {(!activeOrg?.members || activeOrg.members.length === 0) && (
                    <p className="text-center text-white/20 text-sm py-6">Aucun membre pour l'instant.</p>
                  )}
                  {activeOrg?.members?.map((member: any) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-admin-bg border border-white/10 flex items-center justify-center text-white/40 shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 text-sm flex-wrap">
                          Utilisateur #{member.user_id.substring(0, 8)}
                          {member.role === 'owner' && (
                            <span className="text-[10px] bg-admin-accent text-admin-bg px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                              <Shield size={9} /> Owner
                            </span>
                          )}
                          {member.role === 'member' && (
                            <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                              <User size={9} /> Membre
                            </span>
                          )}
                        </div>
                        {member.joined_at && (
                          <div className="text-xs text-white/30 mt-0.5">
                            Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      {isOwner && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Retirer le membre"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
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

export default Organizations;
