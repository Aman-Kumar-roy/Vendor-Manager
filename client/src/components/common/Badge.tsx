import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "emerald" | "amber" | "rose" | "indigo" | "violet" | "slate" | "delivery" | "payment";
  size?: "xs" | "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "slate",
  size = "md",
  dot = false,
}) => {
  const variants: Record<string, string> = {
    brand:    "bg-brand-500/12 text-brand-300 border-brand-500/30 shadow-[0_0_8px_-2px_rgba(12,140,233,0.2)]",
    emerald:  "bg-emerald-500/12 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_-2px_rgba(16,185,129,0.2)]",
    payment:  "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
    amber:    "bg-amber-500/12 text-amber-300 border-amber-500/30 shadow-[0_0_8px_-2px_rgba(245,158,11,0.2)]",
    rose:     "bg-rose-500/12 text-rose-300 border-rose-500/30 shadow-[0_0_8px_-2px_rgba(244,63,94,0.2)]",
    delivery: "bg-indigo-500/12 text-indigo-300 border-indigo-500/30",
    indigo:   "bg-indigo-500/12 text-indigo-300 border-indigo-500/30",
    violet:   "bg-violet-500/12 text-violet-300 border-violet-500/30",
    slate:    "bg-slate-800/70 text-slate-400 border-slate-700/60",
  };

  const dots: Record<string, string> = {
    brand: "bg-brand-400", emerald: "bg-emerald-400", payment: "bg-emerald-400",
    amber: "bg-amber-400", rose: "bg-rose-400", delivery: "bg-indigo-400",
    indigo: "bg-indigo-400", violet: "bg-violet-400", slate: "bg-slate-500",
  };

  const sizes: Record<string, string> = {
    xs: "px-1.5 py-0.5 text-[9px] font-bold",
    sm: "px-2 py-0.5 text-[10px] font-bold",
    md: "px-2.5 py-1 text-[10px] font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${variants[variant] ?? variants.slate} ${sizes[size]}`}
    >
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dots[variant] ?? "bg-slate-500"}`} />
      )}
      {children}
    </span>
  );
};
