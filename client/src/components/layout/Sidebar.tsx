import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  ShoppingCart,
  Receipt,
  Store,
  X,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { navigationConfig, NavItemConfig } from "../../config/navigation.config";

const iconMap = {
  LayoutDashboard,
  Users,
  BarChart2,
  ShoppingCart,
  Receipt,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-card)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Subtle accent border at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500/80 via-indigo-500/80 to-emerald-500/80" />

        {/* Brand Header */}
        <div className="relative h-16 px-5 flex items-center justify-between border-b border-slate-800/60">
          <NavLink to="/dashboard" className="relative flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-brand-500/40 shadow-[0_0_15px_rgba(12,140,233,0.3)] group-hover:shadow-[0_0_22px_rgba(12,140,233,0.5)] transition-all shrink-0 bg-slate-900">
              <img src="/logo.jpg" alt="Vasudha" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight leading-none block">
                VASUDHA
              </span>
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-brand-400 block mt-0.5">
                POLYMER ADMIN
              </span>
            </div>
          </NavLink>

          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Main Menu
          </div>

          {navigationConfig.map((item: NavItemConfig) => {
            const Icon = iconMap[item.iconName] || Store;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? "sidebar-nav-active text-brand-400 bg-brand-500/10 font-bold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex items-center space-x-3">
                      <div
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-brand-500/20 text-brand-400"
                            : "text-slate-500 group-hover:text-slate-200 group-hover:bg-slate-800/80"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>

                    <div className="relative flex items-center space-x-1">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            item.badgeColor === "emerald"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : item.badgeColor === "amber"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-brand-500/15 text-brand-400 border-brand-500/30"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.isPlaceholder && (
                        <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700 font-medium">
                          Soon
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Status Widget */}
        <div className="p-3.5 border-t border-slate-800/60">
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    MySQL Connected
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Production DB • v1.0</p>
                </div>
              </div>
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
