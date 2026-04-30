import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatsCard from '../components/StatsCard';
import { Users, Gamepad2, BookOpen, AlertCircle, Clock, Sparkles } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await axios.get(`${BACKEND_URL}/api/admin/overview`, { withCredentials: true });
      setStats(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-white/40">Chargement du dashboard...</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Bonjour, Admin</h2>
        <p className="text-white/40 text-sm">Voici l'état actuel de BibleQuest.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Utilisateurs"
          value={stats?.total_users || 0}
          icon={<Users size={24} />}
          trend="+12%"
        />
        <StatsCard
          title="Parties Jouées"
          value={stats?.total_games || 0}
          icon={<Gamepad2 size={24} />}
          color="admin-yellow"
        />
        <StatsCard
          title="Questions en Banque"
          value={stats?.total_questions || 0}
          icon={<BookOpen size={24} />}
          color="admin-accent"
        />
        <StatsCard
          title="Questions en attente"
          value={stats?.pending_questions || 0}
          icon={<AlertCircle size={24} />}
          color="red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-admin-card rounded-2xl border border-white/5 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-admin-accent" />
              Inscriptions Récentes
            </h3>
            <button className="text-xs text-admin-accent hover:underline">Voir tout</button>
          </div>
          <div className="space-y-4">
            {stats?.recent_users?.map((u: any) => (
              <div key={u.user_id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <img src={u.picture || '/default_avatar.png'} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-white/40">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Niveau {u.level || 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-admin-card rounded-2xl border border-white/5 p-6 flex items-center justify-center text-center">
          <div className="max-w-xs">
            <div className="mb-4 inline-block p-4 rounded-full bg-admin-accent/10 text-admin-accent">
              <Sparkles size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Expansion du contenu</h3>
            <p className="text-sm text-white/40 mb-6">Utilisez notre Générateur IA pour créer de nouvelles questions thématiques en quelques secondes.</p>
            <button className="w-full bg-admin-accent hover:bg-admin-accent/80 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-admin-accent/20">
              Lancer le Générateur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
