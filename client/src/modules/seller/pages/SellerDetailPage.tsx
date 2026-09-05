import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sellerApi } from "../api";
import { Seller, CreateSellerDto, CreateTransactionDto, Transaction, TransactionType } from "../types";
import { TransactionTable } from "../components/TransactionTable";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { TransactionReceipt } from "../components/TransactionReceipt";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { StatCard } from "../../../components/common/StatCard";
import { Badge } from "../../../components/common/Badge";
import { useAuth } from "../../../context/AuthContext";
import { EditSellerModal } from "../components/EditSellerModal";
import { Toast } from "../../../components/common/Toast";
import {
  ArrowLeft,
  PlusCircle,
  Truck,
  IndianRupee,
  Wallet,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Building2,
  RefreshCw,
  FileText,
  ShieldCheck,
  Receipt as ReceiptIcon,
  Droplets,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export const SellerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [preselectedDeliveryId, setPreselectedDeliveryId] = useState<string | undefined>(undefined);
  const [initialTxType, setInitialTxType] = useState<TransactionType | undefined>(undefined);
  const [isEditSellerModalOpen, setIsEditSellerModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });

  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);

  const fetchSellerDetail = async (page = currentPage, limit = pageSize) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sellerApi.getSellerById(id, { page, limit });
      if (res.success && res.data) {
        const rawData = res.data as any;
        const sellerObj = rawData.seller || rawData;
        setSeller(sellerObj);
        if (sellerObj.pagination) {
          setPaginationMeta(sellerObj.pagination);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load seller details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerDetail(currentPage, pageSize);
  }, [id, currentPage, pageSize]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAddTransaction = async (dto: CreateTransactionDto) => {
    const res = await sellerApi.createTransaction(dto);
    if (res.success) {
      setToastMsg('Transaction created successfully.');
      await fetchSellerDetail();
    }
  };

  const handleDeleteTransaction = (txId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Transaction",
      message: "Are you sure you want to permanently delete this transaction record? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await sellerApi.deleteTransaction(txId);
          await fetchSellerDetail();
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            message: err.response?.data?.message || "Failed to delete transaction. Please try again.",
          });
        }
      },
    });
  };

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val).replace("₹", "₹ ");
  };

  if (loading && !seller) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 animate-fade-in">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading vendor ledger & financial record...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button
          onClick={() => navigate("/sellers")}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sellers</span>
        </button>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-300 flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Error Loading Seller</h4>
            <p className="text-xs mt-1 text-rose-300/80">{error || "Seller account not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const dues = seller.totalDues;
  const qty500 = seller.tank500 || 0;
  const qty1000 = seller.tank1000 || 0;
  const qty2000 = seller.tank2000 || 0;
  const totalTanks = seller.totalTanks ?? (qty500 + qty1000 + qty2000);

  const handleUpdateSeller = async (sellerId: string, dto: Partial<CreateSellerDto>) => {
    const res = await sellerApi.updateSeller(sellerId, dto);
    if (res.success) {
      await fetchSellerDetail();
    }
  };

  const handleDeleteSeller = () => {
    if (!seller) return;
    setConfirmDialog({
      isOpen: true,
      title: "Delete Vendor Account",
      message: `Are you sure you want to permanently delete '${seller.name}'? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await sellerApi.deleteSeller(seller.id);
          navigate("/sellers");
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            message: err.response?.data?.message || "Failed to delete seller. Please try again.",
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/sellers")}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-brand-500/50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sellers Directory</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchSellerDetail(currentPage, pageSize)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-500" : ""}`} />
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setIsEditSellerModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all shadow-sm cursor-pointer hover:text-white"
              title="Edit Vendor Information"
            >
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Edit Vendor</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteSeller}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-800/40 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/40 transition-all cursor-pointer"
              title="Delete Vendor Account"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Vendor</span>
            </button>
          )}

          <button
            onClick={() => {
              setPreselectedDeliveryId(undefined);
              setInitialTxType('DELIVERY');
              setIsAddTxModalOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold !text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-glow"
            style={{
              background: "linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)",
            }}
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span className="text-white">Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Vendor Profile Hero Card */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-card-dark">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shadow-glow-sm shrink-0"
                style={{
                  background: "linear-gradient(135deg, #0c8ce9 0%, #6366f1 100%)",
                }}
              >
                {seller.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {seller.name}
                  </h2>
                  <ShieldCheck className="w-5 h-5 text-brand-500 dark:text-brand-400 shrink-0" />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tracking-wide font-bold bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                    #{seller.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  {dues === 0 ? (
                    <Badge variant="emerald" dot>Account Settled</Badge>
                  ) : dues > 0 ? (
                    <Badge variant={dues > 5000 ? "rose" : "amber"} dot>Dues Outstanding</Badge>
                  ) : (
                    <Badge variant="brand" dot>Credit Balance</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
              {seller.email && (
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 font-medium break-all">
                  <Mail className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0" />
                  {seller.email}
                </span>
              )}
              {seller.phone && (
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 font-medium whitespace-nowrap">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  {seller.phone}
                </span>
              )}
              {seller.gstNumber && (
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 font-medium whitespace-nowrap">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="font-mono font-semibold tracking-wide">GST: {seller.gstNumber}</span>
                </span>
              )}
              {seller.address && (
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                  {seller.address}
                </span>
              )}
            </div>
          </div>

          {/* Tank Delivery Records */}
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
                {totalTanks} {totalTanks === 1 ? "Tank" : "Tanks"}
              </span>
            </div>

            {/* 3 Metric Columns with Light-to-Dark gradient in matching blue/cyan/indigo hue */}
            <div className="grid grid-cols-3 gap-2.5 relative z-10">
              {/* 500L */}
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
                  {qty500}
                </p>
                <p className="text-[10px] text-sky-200/60 font-medium mt-1">
                  units
                </p>
              </div>

              {/* 1,000L */}
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
                  {qty1000}
                </p>
                <p className="text-[10px] text-cyan-200/60 font-medium mt-1">
                  units
                </p>
              </div>

              {/* 2,000L */}
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
                  {qty2000}
                </p>
                <p className="text-[10px] text-indigo-200/60 font-medium mt-1">
                  units
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Goods Delivered"
          value={formatCurrency(seller.totalDeliveries)}
          subtitle="Cumulative order bill (₹)"
          icon={<Truck className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Total Cash Payments"
          value={formatCurrency(seller.totalPaid)}
          subtitle="Total cleared settlements (₹)"
          icon={<IndianRupee className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Total Net Dues"
          value={formatCurrency(seller.totalDues)}
          subtitle="Outstanding balance (₹)"
          icon={<Wallet className="w-5 h-5" />}
          accentColor={seller.totalDues > 0 ? "amber" : "brand"}
        />
      </div>

      {/* Transactions Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-brand-500" />
            <span>Transaction Ledger</span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
              {seller.transactions?.length || 0} Records
            </span>
          </h3>

          <button
            onClick={() => {
              setPreselectedDeliveryId(undefined);
              setInitialTxType('DELIVERY');
              setIsAddTxModalOpen(true);
            }}
            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold flex items-center gap-1.5 bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20 transition-all hover:bg-brand-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>

        <TransactionTable
          transactions={seller.transactions || []}
          onDeleteTransaction={handleDeleteTransaction}
          onPrintReceipt={(tx) => setReceiptTx(tx)}
          seller={seller}
          onAddPaymentToOrder={(deliveryId) => {
            setPreselectedDeliveryId(deliveryId);
            setInitialTxType('PAYMENT');
            setIsAddTxModalOpen(true);
          }}
        />

        {/* Pagination Controls Bar */}
        {paginationMeta.total > 0 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 select-none rounded-2xl border border-slate-800 shadow-card-dark">
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{Math.min((currentPage - 1) * pageSize + 1, paginationMeta.total)}</span> to{" "}
              <span className="font-bold text-white">{Math.min(currentPage * pageSize, paginationMeta.total)}</span> of{" "}
              <span className="font-bold text-brand-400">{paginationMeta.total}</span> transactions
            </div>

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

              <span className="px-3 text-xs font-bold text-slate-300">
                Page {currentPage} of {paginationMeta.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(paginationMeta.totalPages, prev + 1))}
                disabled={currentPage === paginationMeta.totalPages}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(paginationMeta.totalPages)}
                disabled={currentPage === paginationMeta.totalPages}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => {
          setIsAddTxModalOpen(false);
          setPreselectedDeliveryId(undefined);
          setInitialTxType(undefined);
        }}
        sellerId={seller.id}
        sellerName={seller.name}
        deliveries={seller.transactions || []}
        initialDeliveryId={preselectedDeliveryId}
        initialType={initialTxType}
        onSubmit={handleAddTransaction}
      />

      {/* Edit Seller Modal */}
      <EditSellerModal
        isOpen={isEditSellerModalOpen}
        seller={seller}
        onClose={() => setIsEditSellerModalOpen(false)}
        onSubmit={handleUpdateSeller}
      />

      {/* Custom Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
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
        onConfirm={() => setAlertDialog({ isOpen: false, message: "" })}
        onCancel={() => setAlertDialog({ isOpen: false, message: "" })}
      />

      {/* Receipt Modal */}
      {receiptTx && seller && (
        <TransactionReceipt
          isOpen={!!receiptTx}
          onClose={() => setReceiptTx(null)}
          transaction={receiptTx}
          seller={seller}
        />
      )}

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
