import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isRTL } = useLanguage();

  return (
    <div className={`flex h-screen overflow-hidden ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Sidebar - Will be positioned right in RTL via CSS */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isRTL ? 'order-first' : ''}`}>
        {/* Topbar */}
        <Topbar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page content */}
        <main className="main-content flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

