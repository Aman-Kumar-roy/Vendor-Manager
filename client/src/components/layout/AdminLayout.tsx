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
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-0">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
