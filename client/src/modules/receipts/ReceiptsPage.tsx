import React, { useState, useEffect, useCallback } from "react";
import { sellerApi, TransactionWithSeller, PaginationMeta } from "../seller/api";
import { TransactionReceipt } from "../seller/components/TransactionReceipt";
import {
  Receipt,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  X,
  Droplets,
  CreditCard,
  Layers,
} from "lucide-react";

const formatCurrency = (val: number = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 })
    .format(val)
    .replace("₹", "₹ ");

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

type TypeFilter = "ALL" | "DELIVERY" | "PAYMENT";

export const ReceiptsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionWithSeller[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [selectedTx, setSelectedTx] = useState<TransactionWithSeller | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sellerApi.getTransactions({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      });

      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (e) {
      console.error("Failed to load paginated transactions", e);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleTypeChange = (newType: TypeFilter) => {
    setTypeFilter(newType);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Generate page numbers for pagination bar
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const startRecord = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Receipts Center</h2>
          </div>
          <p className="text-xs text-slate-400 ml-0.5">
            Paginated official receipts for all deliveries and payment settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold shadow-sm">
            <Receipt className="w-4 h-4" />
            <span>{pagination.total} Total Receipts</span>
          </div>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh Receipts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor, note, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Transaction Type Filters */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl w-full md:w-auto">
          <button
            onClick={() => handleTypeChange("ALL")}
            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              typeFilter === "ALL"
                ? "bg-brand-600 text-white shadow-glow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            All Receipts
          </button>
          <button
            onClick={() => handleTypeChange("DELIVERY")}
            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              typeFilter === "DELIVERY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Deliveries</span>
          </button>
          <button
            onClick={() => handleTypeChange("PAYMENT")}
            className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              typeFilter === "PAYMENT"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Payments</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-slate-800">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading receipts from API...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No receipts found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search || typeFilter !== "ALL"
              ? "No records matched your search filters. Try clearing your search query."
              : "No transactions recorded yet."}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-card-dark">
          {/* ── Mobile Card View (< md) ── */}
          <div className="md:hidden divide-y divide-slate-800/60">
            {transactions.map((tx) => {
              const isDelivery = String(tx.type).toUpperCase() === "DELIVERY";

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 space-y-3 hover:bg-brand-500/[0.04] transition-colors cursor-pointer"
                >
                  {/* Header: Date + Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {formatDate(tx.date)}
                    </span>

                    {isDelivery ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shrink-0">
                        <ArrowUpRight className="w-3 h-3 text-indigo-400" /> Delivery
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shrink-0">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Payment
                      </span>
                    )}
                  </div>

                  {/* Vendor Info & Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-white text-base leading-snug">
                        {tx.sellerName}
                      </p>
                      {tx.sellerPhone && (
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{tx.sellerPhone}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Amount
                      </span>
                      <span className={`font-mono font-extrabold text-sm ${isDelivery ? "text-indigo-300" : "text-emerald-400"}`}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Details / Note */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="truncate">
                      {isDelivery
                        ? "Delivery Order"
                        : tx.paymentMode ? `Payment: ${tx.paymentMode.replace('_', ' ')}` : "Direct Payment"}
                      {tx.note ? ` • ${tx.note}` : ""}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600/20 text-brand-300 border border-brand-500/30 hover:bg-brand-600 hover:text-white transition-all shrink-0 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table View (>= md) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Vendor / Account</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Details / Breakdown</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {transactions.map((tx) => {
                  const isDelivery = String(tx.type).toUpperCase() === "DELIVERY";
                  const totalTanks = (tx.tank500 || 0) + (tx.tank1000 || 0) + (tx.tank2000 || 0);

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-brand-500/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-slate-300 text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(tx.date)}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors">
                          {tx.sellerName}
                        </p>
                        {tx.sellerPhone && <p className="text-xs text-slate-400">{tx.sellerPhone}</p>}
                      </td>

                      <td className="py-4 px-6">
                        {isDelivery ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                            <ArrowUpRight className="w-3 h-3 text-indigo-400" /> Delivery
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Payment
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-300">
                        {isDelivery ? (
                          totalTanks > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tx.tank500 ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                                  {tx.tank500} × 500L
                                </span>
                              ) : null}
                              {tx.tank1000 ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                                  {tx.tank1000} × 1000L
                                </span>
                              ) : null}
                              {tx.tank2000 ? (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                                  {tx.tank2000} × 2000L
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="italic text-slate-500">Standard Delivery</span>
                          )
                        ) : (
                          <span className="text-slate-400 font-medium">
                            {tx.paymentMode ? `Mode: ${tx.paymentMode}` : "Direct Payment"}
                          </span>
                        )}
                        {tx.note && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                            {tx.note}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right font-extrabold">
                        <span className={isDelivery ? "text-indigo-300" : "text-emerald-400"}>
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-brand-600 hover:text-white transition-all shadow-sm cursor-pointer"
                          title="View & Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            {/* Left: Summary text */}
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{startRecord}</span> to{" "}
              <span className="font-bold text-white">{endRecord}</span> of{" "}
              <span className="font-bold text-brand-400">{pagination.total}</span> receipts
            </div>

            {/* Middle: Rows Per Page Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Per page:</span>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                {[10, 20, 50].map((limitOption) => (
                  <button
                    key={limitOption}
                    onClick={() => handleLimitChange(limitOption)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      pagination.limit === limitOption
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
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevPage}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
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
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        pagination.page === p
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

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedTx && (
        <TransactionReceipt
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          transaction={selectedTx}
          seller={{
            name: selectedTx.sellerName,
            email: selectedTx.sellerEmail,
            phone: selectedTx.sellerPhone,
            address: selectedTx.sellerAddress,
            gstNumber: selectedTx.sellerGstNumber,
          }}
        />
      )}
    </div>
  );
};
