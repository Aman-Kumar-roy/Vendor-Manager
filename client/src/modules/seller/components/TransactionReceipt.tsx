import React from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, Building2, Calendar, DollarSign, FileText, Droplets } from 'lucide-react';
import { Transaction, Seller } from '../types';

interface TransactionReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  seller: Pick<Seller, 'name' | 'email' | 'phone' | 'address'>;
}

const formatCurrency = (val: number = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val).replace('₹', '₹ ');

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
};

const TANK_LABELS: Record<string, string> = {
  '500': '500 Litre Tank',
  '1000': '1,000 Litre Tank',
  '2000': '2,000 Litre Tank',
};

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  isOpen,
  onClose,
  transaction,
  seller,
}) => {
  if (!isOpen) return null;

  const isDelivery = String(transaction.type).toUpperCase() === 'DELIVERY';
  const receiptNo = `RCP-${transaction.id.slice(-8).toUpperCase()}`;
  const tankSize = (transaction as any).tankSize as string | undefined;

  const handlePrint = () => {
    window.print();
  };

  return ReactDOM.createPortal(
    <>
      {/* Backdrop — hidden on print */}
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md animate-fade-in print:hidden"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Receipt shell */}
      <div
        className="fixed inset-0 overflow-y-auto print:overflow-visible print:static"
        style={{ zIndex: 9999 }}
      >
        <div className="flex min-h-full items-center justify-center p-4 print:p-0 print:block">

          {/* Screen controls — hidden on print */}
          <div className="print:hidden w-full max-w-md mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Receipt Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all shadow-glow"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── The actual receipt (screen + print) ── */}
          <div
            className="w-full max-w-md bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none print:max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header band */}
            <div className="bg-slate-900 text-white px-6 py-5 print:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700/80 shrink-0">
                    <img src="/logo.jpg" alt="Vasudha Polymer Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">VASUDHA POLYMER</p>
                    <p className="text-sm font-extrabold text-white leading-none">Official Transaction Receipt</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">{isDelivery ? 'DELIVERY RECEIPT' : 'PAYMENT RECEIPT'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{receiptNo}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Seller info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Seller / Vendor</p>
                <p className="text-sm font-extrabold text-slate-900">{seller.name}</p>
                {seller.phone && <p className="text-xs text-slate-500 mt-0.5">{seller.phone}</p>}
                {seller.email && <p className="text-xs text-slate-500">{seller.email}</p>}
                {seller.address && <p className="text-xs text-slate-500 mt-0.5">{seller.address}</p>}
              </div>

              {/* Transaction details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Transaction ID</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{transaction.id.slice(-12).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Type</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isDelivery
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isDelivery ? 'Delivery Order' : 'Payment Settlement'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Date</span>
                  <span className="text-xs font-semibold text-slate-700">{formatDate(transaction.date)}</span>
                </div>
                {isDelivery && (
                  Boolean(transaction.tank500 || transaction.tank1000 || transaction.tank2000 || tankSize)
                ) && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Tanks Delivered</span>
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      {[
                        (transaction.tank500 ?? 0) > 0 ? `500L: ${transaction.tank500}` : null,
                        (transaction.tank1000 ?? 0) > 0 ? `1000L: ${transaction.tank1000}` : null,
                        (transaction.tank2000 ?? 0) > 0 ? `2000L: ${transaction.tank2000}` : null,
                        !transaction.tank500 && !transaction.tank1000 && !transaction.tank2000 && tankSize ? (TANK_LABELS[tankSize] ?? `${tankSize}L`) : null
                      ].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}
                {transaction.note && (
                  <div className="flex items-start justify-between py-2 border-b border-slate-100 gap-4">
                    <span className="text-xs text-slate-500 font-medium shrink-0">Reference</span>
                    <span className="text-xs text-slate-700 text-right">{transaction.note}</span>
                  </div>
                )}
                {!isDelivery && transaction.parentDelivery && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Linked Delivery</span>
                    <span className="text-xs text-slate-700 font-semibold">{formatDate(transaction.parentDelivery.date)}</span>
                  </div>
                )}
              </div>

              {/* Amount box */}
              <div className={`rounded-xl p-4 text-center ${isDelivery ? 'bg-indigo-50 border border-indigo-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">
                  {isDelivery ? 'Delivery Amount' : 'Payment Amount'}
                </p>
                <p className={`text-3xl font-extrabold ${isDelivery ? 'text-indigo-700' : 'text-emerald-700'}`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* Footer note */}
              <div className="text-center pt-2 pb-1">
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <p className="text-[10px] text-slate-400">Generated by Vasudha Admin Portal</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(new Date().toISOString())}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1">Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          body > #vasudha-receipt-root { display: block !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1cm; size: A5; }
        }
      `}</style>
    </>,
    document.body
  );
};
