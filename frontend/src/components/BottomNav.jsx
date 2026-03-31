import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Gamepad2, Tv, Trophy } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Accueil', path: '/dashboard', icon: <Home size={24} /> },
    { name: 'Jouer', path: '/games', icon: <Gamepad2 size={24} /> },
    { name: 'Direct', path: '/spectate', icon: <Tv size={24} /> },
    { name: 'Classement', path: '/leaderboard', icon: <Trophy size={24} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-950/80 backdrop-blur-xl border-t border-white/10 px-6 py-3 pb-8 z-50 rounded-t-3xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive 
                  ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' 
                  : 'text-blue-300/60 hover:text-blue-200 hover:scale-105'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-wide mt-1">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
