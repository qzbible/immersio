import React from 'react';
import TopHeader from '@/components/TopHeader';

const MainLayout = ({ children }) => {
  return (
    <div
      className="relative min-h-screen text-white overflow-hidden"
      style={{ background: 'var(--bq-bg)' }}
    >
      <TopHeader />

      {/* Subtle ambient gradient – très discret */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 10% 0%, rgba(37,99,235,0.07) 0%, transparent 60%),' +
            'radial-gradient(ellipse 60% 40% at 90% 100%, rgba(249,115,22,0.05) 0%, transparent 60%)',
        }}
      />

      {/* Main scrollable content */}
      <div className="relative z-10 min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};


export default MainLayout;
