import React, { useState } from 'react';
import { Transaction, Seller } from '../types';
import { Badge } from '../../../components/common/Badge';
import { OrderDetailsModal } from './OrderDetailsModal';
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  Trash2,
  Receipt,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Link2,
  CheckCircle2,
  Clock,
  Eye,
  Printer,
  Droplets,
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  seller?: Pick<Seller, 'name' | 'email' | 'phone' | 'address'>;
  onDeleteTransaction: (id: string) => void;
  onPrintReceipt?: (tx: Transaction) => void;
  onAddPaymentToOrder?: (deliveryId: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  seller,
  onDeleteTransaction,
  onPrintReceipt,
  onAddPaymentToOrder,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const selectedDelivery = selectedDeliveryId
    ? transactions.find((t) => t.id === selectedDeliveryId) || null
    : null;

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (val: number = 0) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No transactions recorded</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No delivery or payment history logged yet. Click "Add Transaction" to add the first record.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-card-dark">
        {/* ── Mobile Card View (< md) ── */}
        <div className="md:hidden divide-y divide-slate-800/60">
          {transactions.map((tx) => {
            const isDelivery = String(tx.type).toUpperCase() === 'DELIVERY';
            const hasLinkedPayments = tx.linkedPayments && tx.linkedPayments.length > 0;
            const isExpanded = expandedOrders[tx.id];

            const paidAmount = tx.paidAmount || 0;
            const remainingDue = tx.remainingDue !== undefined ? tx.remainingDue : tx.amount;

            return (
              <div
                key={tx.id}
                className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => {
                  if (isDelivery) {
                    setSelectedDeliveryId(tx.id);
                  } else if (onPrintReceipt) {
                    onPrintReceipt(tx);
                  }
                }}
              >
                {/* Header: Date + Type Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{formatDate(tx.date)}</span>
                  </div>

                  {isDelivery ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                      <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                      Delivery
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                      <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                      Payment
                    </span>
                  )}
                </div>

                {/* Delivery Status or Payment Details */}
                {isDelivery ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Order Status:</span>
                      {remainingDue <= 0 ? (
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Fully Paid
                        </span>
                      ) : paidAmount > 0 ? (
                        <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Partial ({formatCurrency(paidAmount)} paid)
                        </span>
                      ) : (
                        <span className="text-amber-300 font-bold text-xs">Unpaid Order</span>
                      )}
                    </div>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Delivery Bill
                        </span>
                        <span className="font-mono font-extrabold text-indigo-300 text-xs">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Paid
                        </span>
                        <span className="font-mono font-extrabold text-emerald-400 text-xs">
                          {formatCurrency(paidAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Order Due
                        </span>
                        <span className={`font-mono font-extrabold text-xs ${remainingDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatCurrency(remainingDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Payment Amount
                        </span>
                        <span className="font-mono font-extrabold text-emerald-400 text-sm">
                          -{formatCurrency(tx.amount)}
                        </span>
                      </div>
                      {tx.paymentMode && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase text-[10px]">
                          {tx.paymentMode.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {tx.parentDelivery && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs">
                        <Link2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span className="text-brand-300 font-medium">
                          Settlement for Delivery #{tx.parentDelivery.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Note */}
                {tx.note && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{tx.note}</span>
                  </div>
                )}

                {/* Mobile Action Bar */}
                <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                  <div>
                    {isDelivery && hasLinkedPayments && (
                      <button
                        onClick={() => toggleExpand(tx.id)}
                        className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>Payments ({tx.linkedPayments?.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isDelivery && (
                      <button
                        onClick={() => setSelectedDeliveryId(tx.id)}
                        className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    )}
                    {onPrintReceipt && (
                      <button
                        onClick={() => onPrintReceipt(tx)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Expanded Linked Payments */}
                {isDelivery && hasLinkedPayments && isExpanded && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3 text-brand-400" />
                      Linked Payments
                    </div>
                    {tx.linkedPayments?.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="text-emerald-400 font-bold block">
                            {formatCurrency(payment.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(payment.date)}
                          </span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteTransaction(payment.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Desktop Table View (>= md) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3.5 sm:px-4 align-middle whitespace-nowrap">Date</th>
                <th className="py-3 px-3.5 sm:px-4 align-middle min-w-[200px]">Type & Details</th>
                <th className="py-3 px-3.5 sm:px-4 align-middle">Reference / Note</th>
                <th className="py-3 px-3.5 sm:px-4 text-right align-middle whitespace-nowrap">Delivery Bill</th>
                <th className="py-3 px-3.5 sm:px-4 text-right align-middle whitespace-nowrap">Payments Paid</th>
                <th className="py-3 px-3.5 sm:px-4 text-right align-middle whitespace-nowrap">Order Due</th>
                <th className="py-3 px-3.5 sm:px-4 text-right align-middle whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {transactions.map((tx) => {
                const isDelivery = String(tx.type).toUpperCase() === 'DELIVERY';
                const hasLinkedPayments = tx.linkedPayments && tx.linkedPayments.length > 0;
                const isExpanded = expandedOrders[tx.id];

                const paidAmount = tx.paidAmount || 0;
                const remainingDue = tx.remainingDue !== undefined ? tx.remainingDue : tx.amount;

                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (isDelivery) {
                          setSelectedDeliveryId(tx.id);
                        } else if (onPrintReceipt) {
                          onPrintReceipt(tx);
                        }
                      }}
                    >
                      {/* Date */}
                      <td className="py-3 px-3.5 sm:px-4 align-middle font-medium text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isDelivery && hasLinkedPayments && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(tx.id);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Toggle linked payments"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-brand-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <span className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {formatDate(tx.date)}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge & Delivery Details */}
                      <td className="py-3 px-3.5 sm:px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          {isDelivery ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 w-max group-hover:border-indigo-500/50 transition-colors">
                              <ArrowUpRight className="w-3 h-3 text-indigo-400" />
                              DELIVERY ORDER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 w-max">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                              PAYMENT SETTLEMENT
                            </span>
                          )}

                          {isDelivery && (
                            <div className="text-[11px] space-y-1">
                              {remainingDue <= 0 ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Fully Paid
                                </span>
                              ) : paidAmount > 0 ? (
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Partial ({formatCurrency(paidAmount)} paid)
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">Unpaid Order</span>
                              )}
                            </div>
                          )}

                          {!isDelivery && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px]">
                              {tx.paymentMode && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase text-[10px]">
                                  {tx.paymentMode.replace('_', ' ')}
                                </span>
                              )}
                              {tx.parentDelivery && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
                                  <Link2 className="w-3 h-3 text-brand-400 shrink-0" />
                                  <span className="text-brand-300 font-medium">
                                    #{tx.parentDelivery.id.slice(-6).toUpperCase()}
                                  </span>
                                  <span className="text-slate-500 text-[10px]">•</span>
                                  <span className="text-slate-400">
                                    {formatDate(tx.parentDelivery.date)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Note / Memo */}
                      <td className="py-3 px-3.5 sm:px-4 align-middle text-slate-300 text-xs">
                        {tx.note ? (
                          <span className="flex items-center gap-1.5 text-slate-300 max-w-xs">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{tx.note}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No note provided</span>
                        )}
                      </td>

                      {/* Delivery Amount */}
                      <td className="py-3 px-3.5 sm:px-4 text-right align-middle font-extrabold text-xs sm:text-sm whitespace-nowrap">
                        {isDelivery ? (
                          <span className="text-indigo-300">{formatCurrency(tx.amount)}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Payments Paid */}
                      <td className="py-3 px-3.5 sm:px-4 text-right align-middle font-bold text-xs sm:text-sm whitespace-nowrap">
                        {!isDelivery ? (
                          <span className="text-emerald-400">-{formatCurrency(tx.amount)}</span>
                        ) : (
                          <span className="text-emerald-400">{formatCurrency(paidAmount)}</span>
                        )}
                      </td>

                      {/* Order Due */}
                      <td className="py-3 px-3.5 sm:px-4 text-right align-middle font-extrabold text-xs sm:text-sm whitespace-nowrap">
                        {isDelivery ? (
                          <span className={remainingDue > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                            {formatCurrency(remainingDue)}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3.5 sm:px-4 text-right align-middle whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1.5">
                          {isDelivery && (
                            <button
                              onClick={() => setSelectedDeliveryId(tx.id)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-brand-600 transition-colors cursor-pointer"
                              title="View Order Details & Payments"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onPrintReceipt && (
                            <button
                              onClick={() => onPrintReceipt(tx)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Nested Row for Linked Payments */}
                    {isDelivery && hasLinkedPayments && isExpanded && (
                      <tr className="bg-slate-950/70 border-b border-slate-800">
                        <td colSpan={7} className="py-2.5 px-6 sm:px-10">
                          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
                            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <CornerDownRight className="w-3.5 h-3.5 text-brand-400" />
                              Associated Payments Received for Order ({tx.linkedPayments?.length})
                            </div>
                            <div className="space-y-1.5 pt-0.5">
                              {tx.linkedPayments?.map((payment) => (
                                <div
                                  key={payment.id}
                                  className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 text-xs"
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1 whitespace-nowrap">
                                      <ArrowDownLeft className="w-3.5 h-3.5" />
                                      {formatCurrency(payment.amount)}
                                    </span>
                                    <span className="text-slate-400 text-[11px]">
                                      Paid on {formatDate(payment.date)}
                                    </span>
                                    {payment.note && (
                                      <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                                        {payment.note}
                                      </span>
                                    )}
                                  </div>
                                  {isAdmin && (
                                    <button
                                      onClick={() => onDeleteTransaction(payment.id)}
                                      className="p-1 text-slate-500 hover:text-rose-400"
                                      title="Delete Linked Payment"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clickable Delivery Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDeliveryId(null)}
        delivery={selectedDelivery}
        onAddPaymentToOrder={(deliveryId) => {
          if (onAddPaymentToOrder) onAddPaymentToOrder(deliveryId);
        }}
        onDeleteTransaction={onDeleteTransaction}
        onPrintReceipt={onPrintReceipt}
      />
    </>
  );
};
