import React from "react";
import { useNavigate } from "react-router-dom";
import { Seller } from "../types";
import { Badge } from "../../../components/common/Badge";
import {
  Eye, Trash2, Mail, Phone, IndianRupee,
  ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
} from "lucide-react";

interface SellerTableProps {
  sellers: Seller[];
  onDeleteSeller: (id: string, name: string) => void;
}

export const SellerTable: React.FC<SellerTableProps> = ({ sellers, onDeleteSeller }) => {
  const navigate = useNavigate();

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
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(11,19,41,0.65)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 30px -6px rgba(0,0,0,0.5)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/[0.05]"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <th className="py-4 px-6">Seller</th>
              <th className="py-4 px-6 text-right">Deliveries</th>
              <th className="py-4 px-6 text-right">Paid</th>
              <th className="py-4 px-6 text-right">Net Dues</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller, idx) => {
              const dues = seller.totalDues;
              const isSettled = dues === 0;
              const isCredit  = dues < 0;
              const isHighDue = dues > 5000;

              const duesColor = isSettled
                ? "text-emerald-400"
                : isCredit
                ? "text-brand-400"
                : isHighDue
                ? "text-rose-400 font-extrabold"
                : "text-amber-400 font-bold";

              const rowStyle: React.CSSProperties =
                idx % 2 === 0
                  ? { background: "rgba(255,255,255,0.01)" }
                  : { background: "rgba(255,255,255,0)" };

              return (
                <tr
                  key={seller.id}
                  style={rowStyle}
                  className="border-b border-white/[0.04] hover:bg-brand-500/[0.05] transition-colors duration-150 cursor-pointer group"
                  onClick={() => navigate(`/sellers/${seller.id}`)}
                >
                  {/* Seller Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                        style={{
                          background: `linear-gradient(135deg, hsl(${(idx * 47) % 360}, 70%, 50%) 0%, hsl(${(idx * 47 + 40) % 360}, 60%, 35%) 100%)`,
                          boxShadow: `0 4px 12px -2px hsla(${(idx * 47) % 360}, 60%, 40%, 0.4)`,
                        }}
                      >
                        {seller.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-brand-300 transition-colors text-sm">
                          {seller.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                          {seller.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {seller.email}
                            </span>
                          )}
                          {seller.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {seller.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Deliveries */}
                  <td className="py-4 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-indigo-300 font-semibold text-sm">
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {fmt(seller.totalDeliveries)}
                    </span>
                  </td>

                  {/* Paid */}
                  <td className="py-4 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold text-sm">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {fmt(seller.totalPaid)}
                    </span>
                  </td>

                  {/* Net Dues */}
                  <td className="py-4 px-6 text-right">
                    <div className={`text-base font-extrabold flex items-center justify-end gap-1 ${duesColor}`}>
                      {isCredit ? (
                        <TrendingUp className="w-4 h-4 shrink-0" />
                      ) : dues > 0 ? (
                        <TrendingDown className="w-4 h-4 shrink-0" />
                      ) : null}
                      {fmt(dues)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 text-center">
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        Settled
                      </span>
                    ) : isCredit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/25">
                        Overpaid
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isHighDue
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      }`}>
                        Due
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/sellers/${seller.id}`)}
                        className="p-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white hover:bg-brand-500/20 border border-white/[0.05] hover:border-brand-500/30 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSeller(seller.id, seller.name)}
                        className="p-2 rounded-xl bg-white/[0.04] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-white/[0.05] hover:border-rose-500/20 transition-all"
                        title="Delete Seller"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
