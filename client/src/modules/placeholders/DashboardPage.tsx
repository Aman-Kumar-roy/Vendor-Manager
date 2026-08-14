import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sellerApi } from "../seller/api";
import { SellerSummary } from "../seller/types";
import { StatCard } from "../../components/common/StatCard";
import {
  Users, Truck, IndianRupee, Wallet, ArrowRight, Sparkles,
  TrendingUp, BarChart2, Receipt, ShoppingBag,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SellerSummary>({
    totalSellers: 0, totalDeliveries: 0, totalPaid: 0, totalDues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await sellerApi.getSellers();
        if (res.success) setSummary(res.data.summary);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
      .format(v).replace("₹", "₹ ");

  const quickActions = [
    { label: "Manage Sellers", desc: "View & track all vendor accounts", icon: Users, path: "/sellers", color: "brand" },
    { label: "Tank Reports", desc: "Monthly delivery analytics", icon: BarChart2, path: "/reports", color: "emerald" },
    { label: "All Receipts", desc: "Print transaction receipts", icon: Receipt, path: "/receipts", color: "indigo" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 sm:p-10"
        style={{
          background: "linear-gradient(135deg, #0d1a36 0%, #0f2450 40%, #0d1a36 100%)",
          border: "1px solid rgba(12,140,233,0.2)",
          boxShadow: "0 0 60px -20px rgba(12,140,233,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-32 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

        <div className="relative max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-500/40 shadow-[0_0_16px_rgba(12,140,233,0.4)]">
              <img src="/logo.jpg" alt="Vasudha" className="w-full h-full object-cover" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-300 border border-brand-500/25 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Vasudha Polymer Admin Hub
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Seller & Transaction
            <span
              className="block mt-1"
              style={{
                background: "linear-gradient(90deg, #36a9f8 0%, #818cf8 50%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Command Center
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-lg">
            Real-time vendor deliveries, financial settlements, and server-computed dues across all accounts. Powered by MySQL.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/sellers")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)",
                boxShadow: "0 0 20px rgba(12,140,233,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              Manage Sellers
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 hover:border-brand-500/50 hover:text-white transition-all duration-200 bg-white/[0.04] hover:bg-white/[0.08]"
            >
              <BarChart2 className="w-4 h-4 text-brand-400" />
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl shimmer" />
          ))
        ) : (
          <>
            <StatCard title="Total Sellers" value={summary.totalSellers}
              subtitle="Registered vendor accounts"
              icon={<Users className="w-5 h-5" />} accentColor="brand" />
            <StatCard title="Total Deliveries" value={fmt(summary.totalDeliveries)}
              subtitle="Cumulative delivery value (₹)"
              icon={<Truck className="w-5 h-5" />} accentColor="indigo" />
            <StatCard title="Cash Received" value={fmt(summary.totalPaid)}
              subtitle="Cleared settlements (₹)"
              icon={<IndianRupee className="w-5 h-5" />} accentColor="emerald" />
            <StatCard title="Outstanding Dues" value={fmt(summary.totalDues)}
              subtitle="Net unpaid balances (₹)"
              icon={<Wallet className="w-5 h-5" />} accentColor="amber" />
          </>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colorMap: Record<string, string> = {
            brand:   "rgba(12,140,233,0.15)",
            emerald: "rgba(16,185,129,0.15)",
            indigo:  "rgba(99,102,241,0.15)",
          };
          const borderMap: Record<string, string> = {
            brand:   "rgba(12,140,233,0.25)",
            emerald: "rgba(16,185,129,0.25)",
            indigo:  "rgba(99,102,241,0.25)",
          };
          const textMap: Record<string, string> = {
            brand: "text-brand-400", emerald: "text-emerald-400", indigo: "text-indigo-400",
          };
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group relative overflow-hidden text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: colorMap[action.color],
                border: `1px solid ${borderMap[action.color]}`,
              }}
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-xl"
                style={{ background: colorMap[action.color].replace("0.15", "0.8") }} />
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${textMap[action.color]}`}
                style={{ background: colorMap[action.color].replace("0.15","0.3"), border: `1px solid ${borderMap[action.color]}` }}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white">{action.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
              <ArrowRight className={`absolute bottom-4 right-4 w-4 h-4 ${textMap[action.color]} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200`} />
            </button>
          );
        })}
      </div>

      {/* ── System Architecture ──────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">System Architecture</h3>
              <p className="text-[11px] text-slate-500">Live stack overview</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg">
            API v1 • MySQL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Modular Routes", body: "All backend routes mounted inside", code: "routes/v1/", color: "brand" },
            { title: "Feature Modules", body: "Frontend structured inside", code: "src/modules/seller/", color: "indigo" },
            { title: "Config Navigation", body: "Sidebar driven by", code: "navigation.config.ts", color: "emerald" },
          ].map((item) => {
            const bgMap: Record<string, string> = {
              brand: "rgba(12,140,233,0.06)", indigo: "rgba(99,102,241,0.06)", emerald: "rgba(16,185,129,0.06)",
            };
            const codeMap: Record<string, string> = {
              brand: "text-brand-400", indigo: "text-indigo-400", emerald: "text-emerald-400",
            };
            return (
              <div key={item.title} className="p-4 rounded-xl border border-slate-800/80 space-y-1.5"
                style={{ background: bgMap[item.color] }}>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{item.title}</h4>
                <p className="text-xs text-slate-500">
                  {item.body}{" "}
                  <code className={`${codeMap[item.color]} font-mono`}>{item.code}</code>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
