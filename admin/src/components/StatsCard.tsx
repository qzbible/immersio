import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, color = "admin-accent" }) => {
  return (
    <div className="bg-admin-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}/10 text-${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

export default StatsCard;
