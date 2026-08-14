import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
  accentColor?: "brand" | "emerald" | "amber" | "indigo" | "violet";
}

const CONFIG = {
  brand: {
    gradient: "stat-gradient-brand",
    blob: "from-brand-500/30 to-brand-400/5",
    icon: "bg-brand-500/15 text-brand-400 border-brand-500/30 shadow-brand-500/20",
    value: "text-white",
    glow: "shadow-[0_0_30px_-8px_rgba(12,140,233,0.4)]",
    ring: "ring-brand-500/20",
    bar: "bg-brand-500",
  },
  emerald: {
    gradient: "stat-gradient-emerald",
    blob: "from-emerald-500/30 to-emerald-400/5",
    icon: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20",
    value: "text-emerald-300",
    glow: "shadow-[0_0_30px_-8px_rgba(16,185,129,0.35)]",
    ring: "ring-emerald-500/20",
    bar: "bg-emerald-500",
  },
  amber: {
    gradient: "stat-gradient-amber",
    blob: "from-amber-500/25 to-amber-400/5",
    icon: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/20",
    value: "text-amber-300",
    glow: "shadow-[0_0_30px_-8px_rgba(245,158,11,0.35)]",
    ring: "ring-amber-500/20",
    bar: "bg-amber-500",
  },
  indigo: {
    gradient: "stat-gradient-indigo",
    blob: "from-indigo-500/25 to-indigo-400/5",
    icon: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-indigo-500/20",
    value: "text-indigo-300",
    glow: "shadow-[0_0_30px_-8px_rgba(99,102,241,0.35)]",
    ring: "ring-indigo-500/20",
    bar: "bg-indigo-500",
  },
  violet: {
    gradient: "stat-gradient-violet",
    blob: "from-violet-500/25 to-violet-400/5",
    icon: "bg-violet-500/15 text-violet-400 border-violet-500/30 shadow-violet-500/20",
    value: "text-violet-300",
    glow: "shadow-[0_0_30px_-8px_rgba(139,92,246,0.35)]",
    ring: "ring-violet-500/20",
    bar: "bg-violet-500",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = "neutral",
  accentColor = "brand",
}) => {
  const c = CONFIG[accentColor] ?? CONFIG.brand;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ring-1 ${c.ring} ${c.gradient} ${c.glow} glass-card-hover transition-all duration-300 animate-fade-in`}
    >
      {/* Decorative blob */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-bl ${c.blob} blur-2xl opacity-70`}
      />
      <div
        className={`pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-gradient-to-tr ${c.blob} blur-2xl opacity-40`}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-lg ${c.icon}`}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="relative mt-4">
        <div
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${c.value} animate-count`}
        >
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] font-medium text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs font-semibold">
          {trendType === "positive" && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
          {trendType === "negative" && <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
          {trendType === "neutral" && <Minus className="h-3.5 w-3.5 text-slate-500" />}
          <span
            className={
              trendType === "positive"
                ? "text-emerald-400"
                : trendType === "negative"
                ? "text-rose-400"
                : "text-slate-500"
            }
          >
            {trend}
          </span>
        </div>
      )}

      {/* Bottom color bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${c.bar} opacity-30`} />
    </div>
  );
};
