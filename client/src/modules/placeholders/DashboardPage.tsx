import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sellerApi, PaginationMeta } from "../seller/api";
import { Seller, SellerSummary, CreateSellerDto } from "../seller/types";
import { StatCard } from "../../components/common/StatCard";
import { SellerTable } from "../seller/components/SellerTable";
import { AddSellerModal } from "../seller/components/AddSellerModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  Users, Truck, IndianRupee, Wallet, ArrowRight, Sparkles,
  TrendingUp, BarChart2, Receipt, PlusCircle, Search, RefreshCw, Droplets,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";

import { EditSellerModal } from "../seller/components/EditSellerModal";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const dashboardBadge = import.meta.env.VITE_DASHBOARD_BADGE || "Vasudha Polymer Admin Hub";
  const dashboardTitleLine1 = import.meta.env.VITE_DASHBOARD_TITLE_LINE1 || "Seller & Transaction";
  const dashboardTitleLine2 = import.meta.env.VITE_DASHBOARD_TITLE_LINE2 || "Command Center";
  const dashboardSubtitle = import.meta.env.VITE_DASHBOARD_SUBTITLE || "Real-time vendor deliveries, financial settlements, and server-computed dues across all accounts.";

  const [summary, setSummary] = useState<SellerSummary>({
    totalSellers: 0, totalDeliveries: 0, totalPaid: 0, totalDues: 0,
    totalTank500: 0, totalTank1000: 0, totalTank2000: 0, totalTanks: 0,
  });
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    sellerId: string;
    sellerName: string;
  }>({ isOpen: false, sellerId: "", sellerName: "" });

  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Server-side paginated data fetch
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sellerApi.getSellers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
      });
      if (res.success && res.data) {
        setSellers(res.data.sellers || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.pagination) {
          setPaginationMeta(res.data.pagination);
        }
      }
    } catch (e) {
      console.error("Dashboard error loading data", e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSeller = async (dto: CreateSellerDto) => {
    const res = await sellerApi.createSeller(dto);
    if (res.success) {
      await loadData();
    }
  };

  const handleUpdateSeller = async (id: string, dto: Partial<CreateSellerDto>) => {
    const res = await sellerApi.updateSeller(id, dto);
    if (res.success) {
      await loadData();
    }
  };

  const handleDeleteSeller = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      sellerId: id,
      sellerName: name,
    });
  };

  const confirmDelete = async () => {
    const { sellerId } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    try {
      await sellerApi.deleteSeller(sellerId);
      await loadData();
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        message: err.response?.data?.message || "Failed to delete seller. Please try again.",
      });
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(v).replace("₹", "₹ ");

  const totalPages = paginationMeta.totalPages || 1;
  const showingStart = paginationMeta.total === 0 ? 0 : (paginationMeta.page - 1) * paginationMeta.limit + 1;
  const showingEnd = Math.min(paginationMeta.total, paginationMeta.page * paginationMeta.limit);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

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

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-500/40 shadow-[0_0_16px_rgba(12,140,233,0.4)]">
                <img src="/logo.jpg" alt="Vasudha" className="w-full h-full object-cover" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-300 border border-brand-500/25 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                {dashboardBadge}
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {dashboardTitleLine1}
              <span
                className="block mt-1"
                style={{
                  background: "linear-gradient(90deg, #36a9f8 0%, #818cf8 50%, #34d399 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {dashboardTitleLine2}
              </span>
            </h2>
            <p className="text-sm text-slate-300 dark:text-slate-400 mt-3 leading-relaxed">
              {dashboardSubtitle}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold !text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-glow w-full sm:w-auto"
                style={{
                  background: "linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)",
                }}
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="text-white">Add New Seller</span>
              </button>
              <button
                onClick={() => navigate("/reports")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 border border-slate-700 hover:border-brand-500/50 hover:text-white transition-all duration-200 bg-white/[0.08] hover:bg-white/[0.15] cursor-pointer w-full sm:w-auto"
              >
                <BarChart2 className="w-4 h-4 text-brand-400" />
                View Reports
              </button>
            </div>
          </div>

          {/* Right end: Prettier Glassmorphic Tank Delivery Records Card */}
          <div
            className="w-full xl:w-auto xl:min-w-[340px] rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4 shrink-0 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(145deg, rgba(14, 30, 68, 0.72) 0%, rgba(9, 20, 48, 0.88) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.22)",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 35px -10px rgba(12, 140, 233, 0.25)",
            }}
          >
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full bg-sky-400/15 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl" />

            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400/20 to-brand-600/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                  <Droplets className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-100">
                  Tank Delivery Records
                </span>
              </div>
              <span className="text-xs font-mono font-extrabold text-sky-300 bg-sky-500/15 px-3 py-1 rounded-full border border-sky-400/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                {summary.totalTanks || 0} Tanks
              </span>
            </div>

            {/* 3 Metric Columns with Light-to-Dark gradient in matching blue/cyan/indigo hue */}
            <div className="grid grid-cols-3 gap-2.5 relative z-10">
              {/* 500 L */}
              <div
                className="rounded-2xl p-3.5 text-center transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(180deg, rgba(56, 189, 248, 0.15) 0%, rgba(13, 27, 62, 0.6) 100%)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                }}
              >
                <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-wider mb-1">500 L</p>
                <p className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {summary.totalTank500 || 0}
                </p>
                <p className="text-[10px] text-sky-200/60 font-medium mt-1">
                  units
                </p>
              </div>

              {/* 1,000 L */}
              <div
                className="rounded-2xl p-3.5 text-center transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(180deg, rgba(14, 165, 233, 0.13) 0%, rgba(11, 23, 54, 0.65) 100%)",
                  border: "1px solid rgba(14, 165, 233, 0.25)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                }}
              >
                <p className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider mb-1">1,000 L</p>
                <p className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {summary.totalTank1000 || 0}
                </p>
                <p className="text-[10px] text-cyan-200/60 font-medium mt-1">
                  units
                </p>
              </div>

              {/* 2,000 L */}
              <div
                className="rounded-2xl p-3.5 text-center transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(180deg, rgba(99, 102, 241, 0.14) 0%, rgba(10, 20, 48, 0.7) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                }}
              >
                <p className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider mb-1">2,000 L</p>
                <p className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {summary.totalTank2000 || 0}
                </p>
                <p className="text-[10px] text-indigo-200/60 font-medium mt-1">
                  units
                </p>
              </div>
            </div>
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
            brand: "text-brand-500 dark:text-brand-400",
            emerald: "text-emerald-500 dark:text-emerald-400",
            indigo: "text-indigo-500 dark:text-indigo-400",
          };
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group relative overflow-hidden text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
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
              <p className="text-sm font-bold text-slate-900 dark:text-white">{action.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
              <ArrowRight className={`absolute bottom-4 right-4 w-4 h-4 ${textMap[action.color]} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200`} />
            </button>
          );
        })}
      </div>

      {/* ── Live Seller Table on Dashboard ────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active Vendors & Ledger Directory</h3>
              <p className="text-xs text-slate-500">Click any row to open ledger transactions and print official receipts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor, phone, GST..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Refresh Sellers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-500" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading vendor records...</p>
          </div>
        ) : (
          <>
            <SellerTable
              sellers={sellers}
              onDeleteSeller={handleDeleteSeller}
              onEditSeller={(seller) => setEditingSeller(seller)}
            />

            {/* Pagination Controls Bar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 select-none rounded-2xl border border-slate-800 shadow-card-dark">
              {/* Summary text */}
              <div className="text-xs text-slate-400">
                Showing <span className="font-bold text-white">{showingStart}</span> to{" "}
                <span className="font-bold text-white">{showingEnd}</span> of{" "}
                <span className="font-bold text-brand-400">{paginationMeta.total}</span> sellers
              </div>

              {/* Per page selector */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Per page:</span>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  {[10, 20, 50].map((limitOption) => (
                    <button
                      key={limitOption}
                      onClick={() => { setPageSize(limitOption); setCurrentPage(1); }}
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
          </>
        )}
      </div>

      {/* Add Seller Modal */}
      <AddSellerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSeller}
      />

      {/* Edit Seller Modal */}
      <EditSellerModal
        isOpen={!!editingSeller}
        seller={editingSeller}
        onClose={() => setEditingSeller(null)}
        onSubmit={handleUpdateSeller}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Vendor Account"
        message={`Are you sure you want to permanently delete '${confirmDialog.sellerName}'? This will delete all associated transactions.`}
        confirmLabel="Delete Seller"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Alert Dialog */}
      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title="Action Failed"
        message={alertDialog.message}
        confirmLabel="OK"
        cancelLabel=""
        variant="warning"
        onConfirm={() => setAlertDialog({ isOpen: false, message: "" })}
        onCancel={() => setAlertDialog({ isOpen: false, message: "" })}
      />
    </div>
  );
};

