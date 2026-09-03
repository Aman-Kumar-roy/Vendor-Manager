import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Menu, LogOut, Sun, Moon, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { navigationConfig } from "../../config/navigation.config";

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentNav = navigationConfig.find((item) =>
    location.pathname.startsWith(item.path)
  );
  const pageTitle = currentNav ? currentNav.label : "Admin Portal";

  return (
    <header
      className="sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200"
      style={{
        background: "var(--bg-card)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border-card)",
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.15)",
      }}
    >
      {/* Top subtle line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <Link to="/dashboard" className="text-slate-400 hover:text-brand-400 font-semibold transition-colors">
            Vasudha Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
            {pageTitle}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live System
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          id="theme-toggle-btn"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all duration-200"
        >
          {theme === "dark" ? (
            <Sun className="w-4.5 h-4.5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-indigo-400 hover:-rotate-12 transition-transform" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-800 hidden sm:block mx-1" />

        {/* Profile / User */}
        <div className="flex items-center space-x-3">
          <Link
            to="/users"
            title="User Management & Settings"
            className="flex items-center space-x-2.5 p-1 -m-1 rounded-xl hover:bg-slate-800/60 transition-colors group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-glow-sm shrink-0 group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-white group-hover:text-brand-300 flex items-center gap-1 transition-colors">
                {user?.name || "System Administrator"}
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              </div>
              {user?.email && (
                <span className="text-[10px] text-slate-400 block font-mono">
                  {user.email}
                </span>
              )}
            </div>
          </Link>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
