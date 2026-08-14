import React, { useState, useEffect } from "react";
import { sellerApi } from "../seller/api";
import { Seller, Transaction } from "../seller/types";
import { TransactionReceipt } from "../seller/components/TransactionReceipt";
import { Receipt, Printer, ArrowUpRight, ArrowDownLeft, Calendar, Search } from "lucide-react";

const formatCurrency = (val: number = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(val).replace("₹", "₹ ");

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return dateStr; }
};

interface FlatTransaction extends Transaction {
  sellerName: string;
  sellerEmail?: string | null;
  sellerPhone?: string | null;
  sellerAddress?: string | null;
}

export const ReceiptsPage: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<FlatTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<FlatTransaction | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await sellerApi.getSellers();
        if (res.success && res.data?.sellers) {
          const flat: FlatTransaction[] = [];
          for (const seller of res.data.sellers) {
            const detail = await sellerApi.getSellerById(seller.id);
            if (detail.success && detail.data?.seller?.transactions) {
              for (const tx of detail.data.seller.transactions) {
                flat.push({
                  ...tx,
                  sellerName: seller.name,
                  sellerEmail: seller.email,
                  sellerPhone: seller.phone,
                  sellerAddress: seller.address,
                });
              }
            }
          }
          flat.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setAllTransactions(flat);
        }
      } catch (e) {
        console.error("Failed to load transactions", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = allTransactions.filter((tx) => {
    const q = search.toLowerCase();
    return (
      tx.sellerName.toLowerCase().includes(q) ||
      (tx.note || "").toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q)
    );
  });

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
          <p className="text-xs text-slate-400 ml-0.5">Generate and print official receipts for all deliveries and settlements</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold w-max">
          <Receipt className="w-4 h-4" />
          <span>{allTransactions.length} Total Receipts</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by seller, note, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
        />
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading all transaction records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No receipts found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-card-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Seller / Vendor</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Reference</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filtered.map((tx) => {
                  const isDelivery = String(tx.type).toUpperCase() === "DELIVERY";
                  return (
                    <tr key={tx.id} className="hover:bg-brand-500/[0.04] transition-colors">
                      <td className="py-4 px-6 text-slate-300 text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(tx.date)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-white text-sm">{tx.sellerName}</p>
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
                      <td className="py-4 px-6 text-xs text-slate-400 max-w-[180px] truncate">
                        {tx.note || <span className="italic text-slate-600">No reference</span>}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold">
                        <span className={isDelivery ? "text-indigo-300" : "text-emerald-400"}>
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-brand-600 hover:text-white transition-all shadow-sm"
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
          }}
        />
      )}
    </div>
  );
};
