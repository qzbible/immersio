import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Gamepad2, Tv, Trophy } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Accueil',    path: '/dashboard',   icon: Home },
    { name: 'Certifs',    path: '/certifications', icon: Gamepad2 },
    { name: 'Direct',     path: '/spectate',     icon: Tv },
    { name: 'Classement', path: '/leaderboard',  icon: Trophy },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'rgba(13,14,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex justify-around items-center max-w-lg mx-auto px-4 py-3">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-[56px] transition-all duration-200 ${
                isActive ? '' : 'opacity-40 hover:opacity-70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
                  style={
                    isActive
                      ? { background: 'rgba(249,115,22,0.15)', color: '#f97316' }
                      : { color: '#9ca3af' }
                  }
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? '#f97316' : '#6b7280' }}
                >
                  {name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;

