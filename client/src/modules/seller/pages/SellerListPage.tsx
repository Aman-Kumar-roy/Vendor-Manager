import React, { useState, useEffect, useCallback } from 'react';
import { sellerApi, PaginationMeta } from '../api';
import { Seller, SellerSummary, CreateSellerDto } from '../types';
import { SellerTable } from '../components/SellerTable';
import { AddSellerModal } from '../components/AddSellerModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { StatCard } from '../../../components/common/StatCard';
import {
  Users, Truck, IndianRupee, Wallet, Plus, Search, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

import { EditSellerModal } from '../components/EditSellerModal';
import { Toast } from '../../../components/common/Toast';

export const SellerListPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [summary, setSummary] = useState<SellerSummary>({
    totalSellers: 0,
    totalDeliveries: 0,
    totalPaid: 0,
    totalDues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // ── Custom confirm/alert dialog state (no window.confirm / window.alert) ──
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sellerApi.getSellers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
      });
      if (response.success && response.data) {
        setSellers(response.data.sellers || []);
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
        if (response.data.pagination) {
          setPaginationMeta(response.data.pagination);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load sellers list');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleAddSeller = async (dto: CreateSellerDto) => {
    const res = await sellerApi.createSeller(dto);
    if (res.success) {
      setToastMsg('Seller created successfully.');
      await fetchSellers();
    }
  };

  const handleUpdateSeller = async (id: string, dto: Partial<CreateSellerDto>) => {
    const res = await sellerApi.updateSeller(id, dto);
    if (res.success) {
      await fetchSellers();
    }
  };

  const handleDeleteSeller = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Seller',
      message: `Are you sure you want to permanently delete seller "${name}"? All associated transaction records will also be removed. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await sellerApi.deleteSeller(id);
          await fetchSellers();
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            message: err.response?.data?.message || 'Failed to delete seller. Please try again.',
          });
        }
      },
    });
  };

  const totalPages = paginationMeta.totalPages || 1;
  const showingStart = paginationMeta.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(paginationMeta.total, currentPage * pageSize);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val).replace('₹', '₹ ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Seller Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 ml-0.5">
            Overview of all active vendors, server-calculated totals, and settlement dues
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchSellers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-brand-500/50 transition-all shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)',
              boxShadow: '0 0 20px rgba(12,140,233,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Seller</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sellers"
          value={summary.totalSellers}
          subtitle="Registered vendor accounts"
          icon={<Users className="w-5 h-5" />}
          accentColor="brand"
        />
        <StatCard
          title="Total Deliveries"
          value={formatCurrency(summary.totalDeliveries)}
          subtitle="Cumulative goods delivered (₹)"
          icon={<Truck className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          subtitle="Cumulative cash payments (₹)"
          icon={<IndianRupee className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Total Net Dues"
          value={formatCurrency(summary.totalDues)}
          subtitle="Outstanding balances (₹)"
          icon={<Wallet className="w-5 h-5" />}
          accentColor={summary.totalDues > 0 ? 'amber' : 'brand'}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sellers by name, email, or phone..."
            className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
            style={{
              background: 'rgba(11,19,41,0.8)',
              borderColor: searchQuery ? 'rgba(12,140,233,0.5)' : 'rgba(255,255,255,0.07)',
            }}
          />
        </div>
        {searchQuery && (
          <span className="text-xs text-slate-500">
            <span className="text-white font-bold">{paginationMeta.total}</span> result{paginationMeta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {/* Loading Skeleton or Table */}
      {loading && sellers.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading seller directory...</p>
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
            {/* Left: Summary text */}
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{showingStart}</span> to{" "}
              <span className="font-bold text-white">{showingEnd}</span> of{" "}
              <span className="font-bold text-brand-400">{paginationMeta.total}</span> sellers
            </div>

            {/* Middle: Rows Per Page Selector */}
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

            {/* Right: Page Navigation Buttons */}
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

              {/* Page Number Chips */}
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

      {/* Add Seller Modal */}
      <AddSellerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSeller}
      />

      {/* Edit Seller Modal */}
      <EditSellerModal
        isOpen={!!editingSeller}
        seller={editingSeller}
        onClose={() => setEditingSeller(null)}
        onSubmit={handleUpdateSeller}
      />

      {/* Custom Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete Seller"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Error Alert Dialog */}
      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title="Action Failed"
        message={alertDialog.message}
        confirmLabel="OK"
        cancelLabel=""
        variant="warning"
        onConfirm={() => setAlertDialog({ isOpen: false, message: '' })}
        onCancel={() => setAlertDialog({ isOpen: false, message: '' })}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <Toast
          message={toastMsg}
          type="success"
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
    
  );
};

