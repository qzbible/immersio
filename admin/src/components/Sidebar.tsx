import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  Sparkles, 
  BookOpen,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/users", icon: <Users size={20} />, label: "Utilisateurs" },
    { to: "/games", icon: <Gamepad2 size={20} />, label: "Configuration des Modes" },
    { to: "/ai-gen", icon: <Sparkles size={20} />, label: "Générateur IA" },
    { to: "/jeux", icon: <BookOpen size={20} />, label: "Banque de Questions" },
  ];

  return (
    <div className="w-64 h-screen bg-admin-sidebar border-r border-white/5 flex flex-col p-4 fixed left-0 top-0">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-admin-accent to-admin-yellow bg-clip-text text-transparent">
          BibleQuest Admin
        </h1>
        <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Management Suite</p>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-admin-accent/20 text-admin-accent border-r-4 border-admin-accent' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-10">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
