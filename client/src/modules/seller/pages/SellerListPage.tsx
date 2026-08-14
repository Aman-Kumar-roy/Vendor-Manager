import React, { useState, useEffect, useMemo } from 'react';
import { sellerApi } from '../api';
import { Seller, SellerSummary, CreateSellerDto } from '../types';
import { SellerTable } from '../components/SellerTable';
import { AddSellerModal } from '../components/AddSellerModal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { StatCard } from '../../../components/common/StatCard';
import { Users, Truck, IndianRupee, Wallet, Plus, Search, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const PAGE_SIZE = 10;

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

  const fetchSellers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sellerApi.getSellers();
      if (response.success) {
        setSellers(response.data.sellers);
        setSummary(response.data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load sellers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleAddSeller = async (dto: CreateSellerDto) => {
    const res = await sellerApi.createSeller(dto);
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


  // Filtered sellers search
  const filteredSellers = useMemo(() => {
    if (!searchQuery.trim()) return sellers;
    const query = searchQuery.toLowerCase().trim();
    return sellers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query))
    );
  }, [sellers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSellers.length / PAGE_SIZE));
  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredSellers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredSellers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSellers]);

  const showingStart = filteredSellers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(filteredSellers.length, currentPage * PAGE_SIZE);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val).replace('₹', '₹ ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight"
              style={{ background: 'linear-gradient(90deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Seller Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 ml-0.5">
            Overview of all active vendors, server-calculated totals, and settlement dues
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSellers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-brand-500/50 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
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
            <span className="text-white font-bold">{filteredSellers.length}</span> result{filteredSellers.length !== 1 ? 's' : ''}
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
          <SellerTable sellers={paginatedSellers} onDeleteSeller={handleDeleteSeller} />

          {filteredSellers.length > PAGE_SIZE && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
              <div>
                Showing <span className="font-semibold text-slate-100">{showingStart}</span> to{' '}
                <span className="font-semibold text-slate-100">{showingEnd}</span> of{' '}
                <span className="font-semibold text-slate-100">{filteredSellers.length}</span> sellers
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-300 hover:border-brand-500 hover:text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <span className="text-slate-400">
                  Page <span className="font-semibold text-slate-100">{currentPage}</span> of{' '}
                  <span className="font-semibold text-slate-100">{totalPages}</span>
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-300 hover:border-brand-500 hover:text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Seller Modal */}
      <AddSellerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSeller}
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
    </div>
  );
};

