import React from "react";
import { useNavigate } from "react-router-dom";
import { Seller } from "../types";
import { useAuth } from "../../../context/AuthContext";
import {
  Eye, Edit2, Trash2, IndianRupee, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
} from "lucide-react";

interface SellerTableProps {
  sellers: Seller[];
  onDeleteSeller: (id: string, name: string) => void;
  onEditSeller?: (seller: Seller) => void;
}

export const SellerTable: React.FC<SellerTableProps> = ({ sellers, onDeleteSeller, onEditSeller }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 })
      .format(v).replace("₹", "₹ ");

  if (sellers.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-14 text-center border border-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 mb-4">
          <IndianRupee className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">No sellers found</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
          No matching seller accounts. Click &ldquo;Add New Seller&rdquo; to register a vendor.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-card-dark border border-slate-800">
      {/* ── Mobile Card View (< md) ── */}
      <div className="md:hidden divide-y divide-slate-800/60">
        {sellers.map((seller) => {
          const dues = seller.totalDues;
          const isSettled = dues === 0;
          const isCredit = dues < 0;
          const isHighDue = dues > 5000;

          const duesColor = isSettled
            ? "text-emerald-400"
            : isCredit
            ? "text-brand-400"
            : isHighDue
            ? "text-rose-400"
            : "text-amber-400";

          return (
            <div
              key={seller.id}
              className="p-4 space-y-3 hover:bg-brand-500/[0.04] transition-colors cursor-pointer"
              onClick={() => navigate(`/sellers/${seller.id}`)}
            >
              {/* Header: Name + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-white text-base leading-snug">
                    {seller.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 font-mono mt-0.5">
                    {seller.phone && <span>{seller.phone}</span>}
                    {seller.email && (
                      <span className="text-slate-500 font-sans truncate max-w-[180px]">
                        • {seller.email}
                      </span>
                    )}
                  </div>
                </div>

                {isSettled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Settled
                  </span>
                ) : isCredit ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/25 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" /> Overpaid
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${
                    isHighDue
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                      : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isHighDue ? "bg-rose-400" : "bg-amber-400"}`} /> Due
                  </span>
                )}
              </div>

              {/* 3-Column Financial Summary */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Deliveries
                  </span>
                  <span className="font-mono font-extrabold text-indigo-300 text-xs">
                    {fmt(seller.totalDeliveries)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Paid
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400 text-xs">
                    {fmt(seller.totalPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Net Dues
                  </span>
                  <span className={`font-mono font-extrabold text-xs inline-flex items-center gap-0.5 ${duesColor}`}>
                    {isCredit ? (
                      <TrendingUp className="w-3 h-3 shrink-0" />
                    ) : dues > 0 ? (
                      <TrendingDown className="w-3 h-3 shrink-0" />
                    ) : null}
                    {fmt(dues)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => navigate(`/sellers/${seller.id}`)}
                  className="px-3 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-400" />
                  <span>View Ledger</span>
                </button>

                {onEditSeller && isAdmin && (
                  <button
                    onClick={() => onEditSeller(seller)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => onDeleteSeller(seller.id, seller.name)}
                    className="p-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete Seller"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
              <th className="py-4 px-6">Vendor / Account</th>
              <th className="py-4 px-6 text-right">Deliveries</th>
              <th className="py-4 px-6 text-right">Paid</th>
              <th className="py-4 px-6 text-right">Net Dues</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {sellers.map((seller) => {
              const dues = seller.totalDues;
              const isSettled = dues === 0;
              const isCredit  = dues < 0;
              const isHighDue = dues > 5000;

              const duesColor = isSettled
                ? "text-emerald-400"
                : isCredit
                ? "text-brand-400"
                : isHighDue
                ? "text-rose-400"
                : "text-amber-400";

              return (
                <tr
                  key={seller.id}
                  className="hover:bg-brand-500/[0.04] transition-colors duration-150 cursor-pointer group"
                  onClick={() => navigate(`/sellers/${seller.id}`)}
                >
                  {/* Vendor Info */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-extrabold text-white text-sm group-hover:text-brand-300 transition-colors">
                      {seller.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                      {seller.phone && <span>{seller.phone}</span>}
                      {seller.email && (
                        <span className="text-slate-500 font-sans truncate max-w-[160px]">
                          • {seller.email}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Deliveries */}
                  <td className="py-4 px-6 text-right font-mono font-extrabold text-indigo-300 text-sm whitespace-nowrap">
                    {fmt(seller.totalDeliveries)}
                  </td>

                  {/* Paid */}
                  <td className="py-4 px-6 text-right font-mono font-extrabold text-emerald-400 text-sm whitespace-nowrap">
                    {fmt(seller.totalPaid)}
                  </td>

                  {/* Net Dues */}
                  <td className="py-4 px-6 text-right font-mono font-extrabold text-sm whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 ${duesColor}`}>
                      {isCredit ? (
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      ) : dues > 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                      ) : null}
                      {fmt(dues)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Settled
                      </span>
                    ) : isCredit ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" /> Overpaid
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        isHighDue
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isHighDue ? "bg-rose-400" : "bg-amber-400"}`} /> Due
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/sellers/${seller.id}`)}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:text-white"
                        title="View Vendor Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-400" />
                        <span>View</span>
                      </button>

                      {onEditSeller && isAdmin && (
                        <button
                          onClick={() => onEditSeller(seller)}
                          className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:text-white"
                          title="Edit Vendor Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => onDeleteSeller(seller.id, seller.name)}
                          className="p-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Seller"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
