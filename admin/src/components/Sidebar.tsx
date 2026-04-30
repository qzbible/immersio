import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Sparkles,
  BookOpen,
  Building2,
  LogOut,
  ChevronDown,
  Globe,
  User as UserIcon,
  Key,
  FileUp
} from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface SidebarProps {
  user: any;
}

const Sidebar = ({ user }: SidebarProps) => {
  const navigate = useNavigate();
  const { organizations, activeOrgId, activeOrg, switchOrg, isSystem } = useOrganization();
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    // Fallback logic handled by useOrganization hook

    // Fetch pending invitations count
    axios.get(`${BACKEND_URL}/api/admin/invitations`, { withCredentials: true })
      .then(r => setPendingInviteCount(r.data?.length || 0))
      .catch(() => { });
  }, []);

  const links = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/profile", icon: <UserIcon size={20} />, label: "Mon Profil" },
    { to: "/users", icon: <Users size={20} />, label: "Utilisateurs" },
    { to: "/games", icon: <Gamepad2 size={20} />, label: "Configuration des Modes" },
    { to: "/ai-gen", icon: <Sparkles size={20} />, label: "Générateur IA" },
    { to: "/jeux", icon: <BookOpen size={20} />, label: "Banque de Questions" },
    { to: "/import-exams", icon: <FileUp size={20} />, label: "Import Examens" },
  ];

  // Only show Security for staff or org owners
  if (user?.is_admin || user?.is_org_owner) {
    links.push({ to: "/settings", icon: <Key size={20} />, label: "Sécurité" });
  }

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem('active_org_id');
      navigate('/login');
    } catch (err) {
      console.error("Logout failed", err);
      localStorage.removeItem('active_org_id');
      navigate('/login');
    }
  };


  return (
    <div className="w-64 h-screen bg-admin-sidebar border-r border-white/5 flex flex-col p-4 fixed left-0 top-0">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-admin-accent to-admin-yellow bg-clip-text text-transparent">
          Immersio
        </h1>
        <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Management Suite</p>
      </div>

      <div className="px-4 mb-6">
        <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-2 font-bold">
          Espace de travail Actif
        </label>
        <div className="relative group">
          <div className="w-full bg-admin-accent/10 border border-admin-accent/20 text-white text-sm rounded-lg px-3 py-3 flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              {isSystem ? <Globe size={16} className="text-purple-400" /> : <Building2 size={16} className="text-admin-accent" />}
              {isSystem ? "Plateforme (Global)" : (activeOrg?.name || "Organisation")}
            </span>
          </div>
        </div>
        <div className="mt-2 px-1 flex flex-wrap gap-1">
          {isSystem && (
            <span className="text-[10px] font-bold py-0.5 px-2 bg-purple-500/10 text-purple-400 rounded-full uppercase tracking-tighter">
              Admin
            </span>
          )}
          {!isSystem && (
            <span className="text-[10px] font-bold py-0.5 px-2 bg-admin-accent/10 text-admin-accent rounded-full uppercase tracking-tighter">
              Owner
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link: any) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                ? 'bg-admin-accent/20 text-admin-accent border-r-4 border-admin-accent'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="font-medium flex-1">{link.label}</span>
            {link.badge > 0 && (
              <span className="bg-admin-accent text-admin-bg text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
