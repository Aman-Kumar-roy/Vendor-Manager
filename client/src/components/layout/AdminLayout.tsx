import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mesh-dark text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Container */}
      <div className="flex-1 md:pl-56 flex flex-col min-w-0 min-h-screen">
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-5 overflow-y-auto min-h-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 pb-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
