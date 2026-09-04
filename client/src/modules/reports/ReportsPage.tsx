import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/api.client";
import {
  BarChart2,
  Droplets,
  Calendar,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { CustomDateRangePicker, DateRangeValue } from "../../components/ui/CustomDateRangePicker";

interface SellerTankRow {
  sellerId:    string;
  sellerName:  string;
  total500:    number;
  total1000:   number;
  total2000:   number;
  totalOrders: number;
}

type SortKey = "sellerName" | "total500" | "total1000" | "total2000" | "totalOrders";

const getInitialDateRange = (): DateRangeValue => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const sStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const eStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return {
    startDate: sStr,
    endDate: eStr,
    label: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
};

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange]       = useState<DateRangeValue>(getInitialDateRange);
  const [rows, setRows]         = useState<SellerTankRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sortKey, setSortKey]   = useState<SortKey>("totalOrders");
  const [sortAsc, setSortAsc]   = useState(false);
  const [search, setSearch]     = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: {
          period?: string;
          startDate?: string;
          endDate?: string;
          summary: SellerTankRow[];
        };
      }>(`/reports/tank-summary?startDate=${range.startDate}&endDate=${range.endDate}`);
      if (res.data.success) setRows(res.data.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [range.startDate, range.endDate]);

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

  const filteredRows = useMemo(() => {
    if (!search.trim()) return sorted;
    const s = search.toLowerCase().trim();
    return sorted.filter((r) => r.sellerName.toLowerCase().includes(s));
  }, [sorted, search]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, range.startDate, range.endDate, pageSize]);

  const showingStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(currentPage * pageSize, filteredRows.length);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

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

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Date Range Picker */}
          <div className="flex-1 sm:flex-initial">
            <CustomDateRangePicker
              value={range}
              onChange={(r) => setRange(r)}
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Period Banner */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-card-dark relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow-sm shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Report Period</p>
            <p className="text-xl font-extrabold text-white">{range.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-8 w-full sm:w-auto">
          <div className="text-center bg-slate-900/40 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-800/60">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">500 L Tanks</p>
            <p className="text-xl font-extrabold text-blue-400 mt-0.5">{totals.t500}</p>
          </div>
          <div className="text-center bg-slate-900/40 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-800/60">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">1,000 L Tanks</p>
            <p className="text-xl font-extrabold text-indigo-400 mt-0.5">{totals.t1000}</p>
          </div>
          <div className="text-center bg-slate-900/40 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-800/60">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">2,000 L Tanks</p>
            <p className="text-xl font-extrabold text-violet-400 mt-0.5">{totals.t2000}</p>
          </div>
          <div className="text-center bg-slate-900/40 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-800/60 sm:border-l sm:border-slate-800 sm:pl-8">
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor in reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 self-end sm:self-center">
          Total: <span className="font-bold text-white">{filteredRows.length}</span> active vendors
        </div>
      </div>

      {/* Table */}
      {loading && rows.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Compiling monthly report data...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-card-dark">
          {/* ── Mobile Card View (< md) ── */}
          <div className="md:hidden divide-y divide-slate-800/60">
            {filteredRows.length === 0 ? (
              <div className="py-12 text-center p-4">
                <Droplets className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300">No tank orders found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {search ? `No vendors match "${search}"` : `No delivery orders logged for ${range.label}`}
                </p>
              </div>
            ) : (
              paginatedRows.map((row, idx) => {
                const globalRank = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <div
                    key={row.sellerId}
                    onClick={() => navigate(`/sellers/${row.sellerId}`)}
                    className="p-4 space-y-3 hover:bg-brand-500/[0.04] transition-colors cursor-pointer"
                  >
                    {/* Header: Rank + Name + Total Orders */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border ${
                            globalRank === 1
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                              : globalRank === 2
                              ? "bg-slate-700/30 text-slate-300 border-slate-700"
                              : globalRank === 3
                              ? "bg-amber-600/10 text-amber-600 border-amber-600/25"
                              : "bg-slate-800/40 text-slate-500 border-slate-800"
                          }`}
                        >
                          #{globalRank}
                        </span>
                        <h4 className="font-extrabold text-white text-base">
                          {row.sellerName}
                        </h4>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-brand-500/10 text-brand-300 border border-brand-500/25 shrink-0">
                        <Droplets className="w-3.5 h-3.5 text-brand-400" />
                        <span>{row.totalOrders} Orders</span>
                      </span>
                    </div>

                    {/* 3 Tank Size Cards */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                      <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          500 L
                        </span>
                        <span className="font-mono font-extrabold text-blue-400 text-xs">
                          {row.total500}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          1,000 L
                        </span>
                        <span className="font-mono font-extrabold text-indigo-400 text-xs">
                          {row.total1000}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          2,000 L
                        </span>
                        <span className="font-mono font-extrabold text-violet-400 text-xs">
                          {row.total2000}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Desktop Table View (>= md) ── */}
          <div className="hidden md:block overflow-x-auto">
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
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Droplets className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-300">No tank orders found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {search ? `No vendors match "${search}"` : `No delivery orders logged for ${range.label}`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const globalRank = (currentPage - 1) * pageSize + idx + 1;
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
                              globalRank === 1
                                ? "text-amber-400"
                                : globalRank === 2
                                ? "text-slate-300"
                                : globalRank === 3
                                ? "text-amber-600"
                                : "text-slate-600"
                            }`}
                          >
                            #{globalRank}
                          </span>
                        </td>

                        {/* Seller Name */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-white group-hover:text-brand-300 transition-colors text-sm">
                            {row.sellerName}
                          </div>
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
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/80 border-t border-slate-800 text-xs font-bold text-slate-300">
                    <td className="py-3.5 px-5 text-slate-400 font-semibold" colSpan={2}>
                      Total Summary ({filteredRows.length} sellers)
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

          {/* Pagination Controls Bar */}
          {filteredRows.length > 0 && (
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              {/* Summary text */}
              <div className="text-xs text-slate-400">
                Showing <span className="font-bold text-white">{showingStart}</span> to{" "}
                <span className="font-bold text-white">{showingEnd}</span> of{" "}
                <span className="font-bold text-brand-400">{filteredRows.length}</span> vendors
              </div>

              {/* Per page selector */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Per page:</span>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  {[10, 20, 50].map((limitOption) => (
                    <button
                      key={limitOption}
                      onClick={() => setPageSize(limitOption)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        pageSize === limitOption
                          ? "bg-brand-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {limitOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) =>
                    typeof p === "number" ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          currentPage === p
                            ? "bg-brand-600 text-white shadow-glow-sm"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-slate-600 text-xs">
                        {p}
                      </span>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
