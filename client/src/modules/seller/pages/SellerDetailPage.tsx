import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sellerApi } from "../api";
import { Seller, CreateTransactionDto, Transaction } from "../types";
import { TransactionTable } from "../components/TransactionTable";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { TransactionReceipt } from "../components/TransactionReceipt";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { StatCard } from "../../../components/common/StatCard";
import { Badge } from "../../../components/common/Badge";
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
} from "lucide-react";

export const SellerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);

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

  const fetchSellerDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sellerApi.getSellerById(id);
      if (res.success && res.data) {
        setSeller(res.data.seller);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load seller details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerDetail();
  }, [id]);

  const handleAddTransaction = async (dto: CreateTransactionDto) => {
    const res = await sellerApi.createTransaction(dto);
    if (res.success) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/sellers")}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-brand-500/50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sellers Directory</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSellerDetail}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsAddTxModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #0c8ce9 0%, #026ec7 100%)",
              boxShadow: "0 0 20px rgba(12,140,233,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Vendor Profile Hero Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 relative overflow-hidden shadow-card-dark">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shadow-glow-sm"
                style={{
                  background: "linear-gradient(135deg, #0c8ce9 0%, #6366f1 100%)",
                }}
              >
                {seller.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {seller.name}
                  </h2>
                  <ShieldCheck className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex items-center space-x-2.5 mt-1">
                  <span className="text-[11px] text-slate-400 font-mono tracking-wide font-bold bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-md">
                    #{seller.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-slate-600">•</span>
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              {seller.email && (
                <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800/60">
                  <Mail className="w-3.5 h-3.5 text-brand-400" />
                  {seller.email}
                </span>
              )}
              {seller.phone && (
                <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800/60">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {seller.phone}
                </span>
              )}
              {seller.gstNumber && (
                <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800/60">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono font-semibold tracking-wide">GST: {seller.gstNumber}</span>
                </span>
              )}
              {seller.address && (
                <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800/60">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {seller.address}
                </span>
              )}
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
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-brand-400" />
            <span>Transaction Ledger</span>
            <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20">
              {seller.transactions?.length || 0} Records
            </span>
          </h3>

          <button
            onClick={() => setIsAddTxModalOpen(true)}
            className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1.5 bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/20 transition-all hover:bg-brand-500/20"
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
          onAddPaymentToOrder={(_deliveryId) => {
            setIsAddTxModalOpen(true);
          }}
        />
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        sellerId={seller.id}
        sellerName={seller.name}
        deliveries={seller.transactions || []}
        onSubmit={handleAddTransaction}
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
    </div>
  );
};
