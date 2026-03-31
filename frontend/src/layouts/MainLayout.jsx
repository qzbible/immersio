import React from 'react';
import BottomNav from '@/components/BottomNav';

const MainLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-[#1e1b4b] to-purple-900 text-white overflow-hidden">
      {/* Background Ambience (Games style) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full blur-[120px]" />
      </div>
      
      {/* 
        Main scrollable container. 
        pb-28 ensures content is not hidden behind the fixed BottomNav.
      */}
      <div className="relative z-10 min-h-screen pb-28 backdrop-blur-[2px] overflow-x-hidden">
        {children}
      </div>
      
      {/* Global Mobile App Navigation */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
