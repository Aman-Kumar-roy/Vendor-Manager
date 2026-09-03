import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Transaction } from '../types';
import { Badge } from '../../../components/common/Badge';
import {
  Truck,
  DollarSign,
  Calendar,
  FileText,
  Trash2,
  PlusCircle,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Receipt,
  CornerDownRight,
  Droplets,
} from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Transaction | null;
  onAddPaymentToOrder: (deliveryId: string) => void;
  onDeleteTransaction: (id: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onAddPaymentToOrder,
  onDeleteTransaction,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    txId: string;
    label: string;
    isMainOrder?: boolean;
  }>({ isOpen: false, txId: '', label: '', isMainOrder: false });

  if (!delivery) return null;

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val).replace('₹', '₹ ');
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

  const paidAmount = delivery.paidAmount || 0;
  const remainingDue = delivery.remainingDue !== undefined ? delivery.remainingDue : delivery.amount;
  const linkedPayments = delivery.linkedPayments || [];

  const tank500 = delivery.tank500 || 0;
  const tank1000 = delivery.tank1000 || 0;
  const tank2000 = delivery.tank2000 || 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Delivery Order Breakdown"
        subtitle={`Detailed view of order bill and associated partial payments`}
        maxWidth="xl"
      >
        <div className="space-y-6">
          {/* Delivery Header Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Delivery Order</span>
                    {remainingDue <= 0 ? (
                      <Badge variant="emerald">Fully Settled</Badge>
                    ) : paidAmount > 0 ? (
                      <Badge variant="amber">Partial Payment</Badge>
                    ) : (
                      <Badge variant="rose">Unpaid</Badge>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Order ID: {delivery.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onAddPaymentToOrder(delivery.id);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-glow transition-all cursor-pointer w-max"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Payment to Order</span>
                </button>

                <button
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      txId: delivery.id,
                      label: `Delivery Order (${formatCurrency(delivery.amount)})`,
                      isMainOrder: true,
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Delivery Order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Delivery Note & Date */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Date: {formatDate(delivery.date)}
              </span>
              {delivery.note && (
                <span className="flex items-center gap-1.5 text-slate-200">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Note: {delivery.note}
                </span>
              )}
            </div>
          </div>

          {/* Tanks Delivered Breakdown Section */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-400" />
              Tanks Delivered Breakdown
            </span>
            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">500 L Tank</span>
                <span className="text-base font-extrabold text-blue-300 mt-0.5 block">{tank500} Units</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">1,000 L Tank</span>
                <span className="text-base font-extrabold text-blue-300 mt-0.5 block">{tank1000} Units</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">2,000 L Tank</span>
                <span className="text-base font-extrabold text-blue-300 mt-0.5 block">{tank2000} Units</span>
              </div>
            </div>
          </div>

          {/* Financial Metrics Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Order Bill
              </span>
              <p className="text-lg font-extrabold text-indigo-300 mt-1">
                {formatCurrency(delivery.amount)}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Payments Paid
              </span>
              <p className="text-lg font-extrabold text-emerald-400 mt-1">
                {formatCurrency(paidAmount)}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Remaining Order Due
              </span>
              <p
                className={`text-lg font-extrabold mt-1 ${
                  remainingDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(remainingDue)}
              </p>
            </div>
          </div>

          {/* Associated Partial Payments List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CornerDownRight className="w-4 h-4 text-brand-400" />
                Associated Payments History ({linkedPayments.length})
              </h5>
            </div>

            {linkedPayments.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 text-center text-xs text-slate-400">
                No partial payments have been recorded for this delivery order yet. Click "Add Payment to Order" above to log a payment.
              </div>
            ) : (
              <div className="space-y-2">
                {linkedPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Paid on {formatDate(p.date)} {p.note ? `• ${p.note}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setDeleteConfirm({
                          isOpen: true,
                          txId: p.id,
                          label: `Payment of ${formatCurrency(p.amount)}`,
                          isMainOrder: false,
                        });
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* In-App Custom Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Confirm Delete"
        message={`Are you sure you want to permanently delete "${deleteConfirm.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          const idToDelete = deleteConfirm.txId;
          const isMain = deleteConfirm.isMainOrder;
          setDeleteConfirm({ isOpen: false, txId: '', label: '', isMainOrder: false });
          onDeleteTransaction(idToDelete);
          if (isMain) {
            onClose();
          }
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, txId: '', label: '', isMainOrder: false })}
      />
    </>
  );
};
