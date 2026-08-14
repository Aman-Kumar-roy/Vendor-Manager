import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/api.client";
import { BarChart2, Droplets, Calendar, ArrowRight, TrendingUp, RefreshCw, AlertCircle, ChevronUp, ChevronDown, Layers } from "lucide-react";

interface SellerTankRow {
  sellerId:    string;
  sellerName:  string;
  total500:    number;
  total1000:   number;
  total2000:   number;
  totalOrders: number;
}

type SortKey = "sellerName" | "total500" | "total1000" | "total2000" | "totalOrders";

const toMonthParam = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year:  "numeric",
  });
};

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth]       = useState(() => toMonthParam(new Date()));
  const [rows, setRows]         = useState<SellerTankRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sortKey, setSortKey]   = useState<SortKey>("totalOrders");
  const [sortAsc, setSortAsc]   = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { month: string; summary: SellerTankRow[] };
      }>(`/reports/tank-summary?month=${month}`);
      if (res.data.success) setRows(res.data.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [month]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "sellerName"); }
  };

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  const totals = useMemo(() => ({
    t500:    rows.reduce((s, r) => s + r.total500,    0),
    t1000:   rows.reduce((s, r) => s + r.total1000,   0),
    t2000:   rows.reduce((s, r) => s + r.total2000,   0),
    total:   rows.reduce((s, r) => s + r.totalOrders, 0),
  }), [rows]);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortAsc
      ? <ChevronUp className="w-3.5 h-3.5 ml-1 inline text-brand-400" />
      : <ChevronDown className="w-3.5 h-3.5 ml-1 inline text-brand-400" />;

  const ThButton = ({
    k, children, className = "",
  }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      className={`py-3.5 px-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-white transition-colors ${className}`}
      onClick={() => handleSort(k)}
    >
      {children}
      <SortIcon k={k} />
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Tank Order Reports
            </h2>
          </div>
          <p className="text-xs text-slate-400 ml-0.5">
            Monthly tank delivery analytics per seller — sorted by total tank orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Picker */}
          <div className="relative flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2">
            <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Period Banner */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-wrap items-center justify-between gap-6 shadow-card-dark relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Report Period</p>
            <p className="text-xl font-extrabold text-white">{formatMonthLabel(month)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">500 L Tanks</p>
            <p className="text-xl font-extrabold text-blue-400 mt-0.5">{totals.t500}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">1,000 L Tanks</p>
            <p className="text-xl font-extrabold text-indigo-400 mt-0.5">{totals.t1000}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">2,000 L Tanks</p>
            <p className="text-xl font-extrabold text-violet-400 mt-0.5">{totals.t2000}</p>
          </div>
          <div className="text-center border-l border-slate-800 pl-6 sm:pl-8">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-extrabold text-brand-400 mt-0.5">{totals.total}</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading && rows.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Compiling monthly report data...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-card-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-3.5 px-5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 w-12">
                    # Rank
                  </th>
                  <ThButton k="sellerName">Seller Name</ThButton>
                  <ThButton k="total500" className="text-right">500 L Tanks</ThButton>
                  <ThButton k="total1000" className="text-right">1,000 L Tanks</ThButton>
                  <ThButton k="total2000" className="text-right">2,000 L Tanks</ThButton>
                  <ThButton k="totalOrders" className="text-right">Total Tank Orders</ThButton>
                  <th className="py-3.5 px-5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Droplets className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-300">No tank orders found</p>
                      <p className="text-xs text-slate-500 mt-1">No delivery orders logged for {formatMonthLabel(month)}</p>
                    </td>
                  </tr>
                ) : (
                  sorted.map((row, idx) => {
                    const hasOrders = row.totalOrders > 0;
                    return (
                      <tr
                        key={row.sellerId}
                        onClick={() => navigate(`/sellers/${row.sellerId}`)}
                        className="hover:bg-brand-500/[0.04] transition-colors cursor-pointer group"
                      >
                        {/* Rank */}
                        <td className="py-4 px-5">
                          <span
                            className={`text-xs font-extrabold ${
                              idx === 0
                                ? "text-amber-400"
                                : idx === 1
                                ? "text-slate-300"
                                : idx === 2
                                ? "text-amber-600"
                                : "text-slate-600"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>

                        {/* Seller Name */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-white group-hover:text-brand-300 transition-colors text-sm">
                            {row.sellerName}
                          </div>
                          {hasOrders && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {row.total500 > 0 && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                                  {row.total500} × 500L
                                </span>
                              )}
                              {row.total1000 > 0 && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold">
                                  {row.total1000} × 1000L
                                </span>
                              )}
                              {row.total2000 > 0 && (
                                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-bold">
                                  {row.total2000} × 2000L
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 500 L */}
                        <td className="py-4 px-5 text-right">
                          {row.total500 > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-extrabold text-xs">
                              <Droplets className="w-3 h-3" />
                              {row.total500}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">—</span>
                          )}
                        </td>

                        {/* 1000 L */}
                        <td className="py-4 px-5 text-right">
                          {row.total1000 > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold text-xs">
                              <Droplets className="w-3 h-3" />
                              {row.total1000}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">—</span>
                          )}
                        </td>

                        {/* 2000 L */}
                        <td className="py-4 px-5 text-right">
                          {row.total2000 > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 font-extrabold text-xs">
                              <Droplets className="w-3 h-3" />
                              {row.total2000}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">—</span>
                          )}
                        </td>

                        {/* Total Orders */}
                        <td className="py-4 px-5 text-right">
                          <span
                            className={`text-base font-extrabold ${
                              row.totalOrders > 0 ? "text-brand-400" : "text-slate-600"
                            }`}
                          >
                            {row.totalOrders}
                          </span>
                        </td>

                        {/* Arrow */}
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/sellers/${row.sellerId}`)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-brand-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="View Seller"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {sorted.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/80 border-t border-slate-800 text-xs font-bold text-slate-300">
                    <td className="py-3.5 px-5 text-slate-400 font-semibold" colSpan={2}>
                      Total Summary ({sorted.length} sellers)
                    </td>
                    <td className="py-3.5 px-5 text-right text-blue-400 font-extrabold">{totals.t500}</td>
                    <td className="py-3.5 px-5 text-right text-indigo-400 font-extrabold">{totals.t1000}</td>
                    <td className="py-3.5 px-5 text-right text-violet-400 font-extrabold">{totals.t2000}</td>
                    <td className="py-3.5 px-5 text-right text-brand-400 text-sm font-extrabold">{totals.total}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
