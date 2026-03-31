import React from 'react';
import { motion } from 'framer-motion';

const OrbitalAvatar = ({ user, badges = [], size = 120 }) => {
  const avatarUrl = user?.picture || '/default_avatar.png';
  const displayBadges = badges.slice(0, 8); // Max 8 badges on the orbit to avoid clutter
  const radius = size / 2 + 16; // Distance from center to badge center

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size + 60, height: size + 60 }}>
      {/* Central Avatar */}
      <motion.div 
        className="relative z-10 rounded-full border-4 border-yellow-400 overflow-hidden bg-blue-950 shadow-[0_0_30px_rgba(250,204,21,0.3)]"
        style={{ width: size, height: size }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <img 
          src={avatarUrl} 
          alt={user?.name || 'Avater'} 
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Orbiting Badges */}
      {displayBadges.map((badge, index) => {
        // Calculate angle (spread evenly around the circle)
        // Start at -90deg (top) and go clockwise
        const angle = (index / displayBadges.length) * 360 - 90;
        const radian = angle * (Math.PI / 180);
        
        // Calculate X and Y position
        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius;

        return (
          <motion.div
            key={badge.badge_id || index}
            className="absolute z-20 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-900 border-2 border-yellow-400 shadow-lg text-lg md:text-xl"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{ opacity: 1, x, y, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 12,
              delay: 0.2 + (index * 0.1) 
            }}
            title={badge.name}
          >
            {badge.icon}
          </motion.div>
        );
      })}

      {/* Level Badge (Bottom Center) */}
      <motion.div
        className="absolute z-30 bottom-1 bg-gradient-to-r from-yellow-400 to-amber-600 text-blue-950 px-4 py-1 rounded-full font-black text-sm border-2 border-blue-950 shadow-xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        LVL {user?.level || 1}
      </motion.div>
    </div>
  );
};

export default OrbitalAvatar;
