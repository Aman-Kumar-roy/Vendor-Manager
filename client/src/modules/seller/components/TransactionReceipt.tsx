import React from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, Droplets, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';
import { Transaction, Seller } from '../types';

interface TransactionReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  seller: Pick<Seller, 'name' | 'email' | 'phone' | 'address' | 'gstNumber'>;
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

// Company details from .env configuration
const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || "Vasudha Polymer";
const COMPANY_GST = import.meta.env.VITE_COMPANY_GST || "07AAAAA0000A1Z5";
const COMPANY_PHONE = import.meta.env.VITE_COMPANY_PHONE || "+91 98765 43210";
const COMPANY_ADDRESS = import.meta.env.VITE_COMPANY_ADDRESS || "Plot 42, Industrial Zone, New Delhi - 110020";

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  isOpen,
  onClose,
  transaction,
  seller,
}) => {
  if (!isOpen) return null;

  const isDelivery = String(transaction.type).toUpperCase() === 'DELIVERY';
  const receiptNo = `RCP-${transaction.id.slice(-8).toUpperCase()}`;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Receipt-${receiptNo}-${seller.name.replace(/\s+/g, '_')}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return ReactDOM.createPortal(
    <>
      {/* Backdrop — hidden on print */}
      <div
        id="receipt-modal-backdrop"
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in print:hidden"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Receipt shell */}
      <div
        className="fixed inset-0 overflow-y-auto print:overflow-visible print:static"
        style={{ zIndex: 9999 }}
      >
        <div className="flex flex-col min-h-full items-center justify-center p-2.5 sm:p-6 print:p-0 print:block">

          {/* Screen controls — hidden on print */}
          <div className="print:hidden w-full max-w-lg mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-300 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Official Receipt Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 !text-white text-xs font-bold transition-all shadow-glow cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4 text-white" />
                <span className="text-white">Print / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── The printable receipt card ── */}
          <div
            id="printable-receipt-card"
            className="w-full max-w-lg bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none print:max-w-full border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header band */}
            <div className="bg-slate-900 text-white px-6 py-5 print:py-4 print:bg-slate-900 print:text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 bg-white p-0.5 mt-0.5">
                    <img src="/logo.jpg" alt="Vasudha Polymer Logo" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-brand-400 font-extrabold">{COMPANY_NAME}</p>
                    <p className="text-sm font-bold text-slate-300 leading-tight mt-0.5">{COMPANY_ADDRESS}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                      <span>Phone: {COMPANY_PHONE}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-200">GSTIN: {COMPANY_GST}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    isDelivery ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {isDelivery ? 'DELIVERY RECEIPT' : 'PAYMENT RECEIPT'}
                  </span>
                  <p className="text-xs text-slate-300 mt-1.5 font-mono font-extrabold">{receiptNo}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Seller / Vendor info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Seller / Vendor Details
                  </p>
                  {seller.gstNumber && (
                    <span className="text-[11px] font-mono font-extrabold bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                      GSTIN: {seller.gstNumber}
                    </span>
                  )}
                </div>
                <p className="text-base font-extrabold text-slate-900">{seller.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-slate-600">
                  {seller.phone && <p className="font-medium">Phone: {seller.phone}</p>}
                  {seller.email && <p>{seller.email}</p>}
                  {seller.address && <p className="sm:col-span-2">{seller.address}</p>}
                </div>
              </div>

              {/* Transaction details table */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-800">{transaction.id.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Transaction Type</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    isDelivery
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {isDelivery ? 'Delivery Order (Goods)' : 'Payment Settlement'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Date of Record</span>
                  <span className="font-bold text-slate-800">{formatDate(transaction.date)}</span>
                </div>

                {/* Delivery Tank Details */}
                {isDelivery && (
                  Boolean(
                    transaction.tank500 ||
                    transaction.tank1000 ||
                    transaction.tank2000
                  )
                ) && (
                  <div className="flex items-start justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Tanks Delivered</span>
                    <span className="font-bold text-blue-800 text-right flex flex-wrap items-center justify-end gap-1.5 max-w-[280px]">
                      <Droplets className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
                      {[
                        (transaction.tank500 ?? 0) > 0 ? `500L: ${transaction.tank500}` : null,
                        (transaction.tank1000 ?? 0) > 0 ? `1000L: ${transaction.tank1000}` : null,
                        (transaction.tank2000 ?? 0) > 0 ? `2000L: ${transaction.tank2000}` : null,
                      ].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}

                {isDelivery && transaction.vehicleNumber && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Vehicle / Transport</span>
                    <span className="font-mono font-bold text-slate-800">{transaction.vehicleNumber}</span>
                  </div>
                )}

                {!isDelivery && transaction.paymentMode && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Payment Mode</span>
                    <span className="font-bold text-emerald-900 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {transaction.paymentMode.replace('_', ' ')}
                    </span>
                  </div>
                )}

                {transaction.note && (
                  <div className="flex items-start justify-between py-1.5 border-b border-slate-100 gap-4">
                    <span className="text-slate-500 font-medium shrink-0">Reference / Note</span>
                    <span className="text-slate-800 text-right font-medium">{transaction.note}</span>
                  </div>
                )}

                {!isDelivery && transaction.parentDelivery && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Linked Delivery Order</span>
                    <span className="text-slate-800 font-semibold">{formatDate(transaction.parentDelivery.date)}</span>
                  </div>
                )}
              </div>

              {/* Amount box */}
              <div className={`rounded-xl p-5 text-center shadow-sm ${isDelivery ? 'bg-indigo-50/90 border border-indigo-200' : 'bg-emerald-50/90 border border-emerald-200'}`}>
                <p className="text-[11px] uppercase tracking-widest font-bold mb-1 text-slate-600">
                  {isDelivery ? 'Total Delivery Amount' : 'Amount Cleared / Settled'}
                </p>
                <p className={`text-3xl font-extrabold tracking-tight ${isDelivery ? 'text-indigo-900' : 'text-emerald-900'}`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* Signature Block for Print */}
              <div className="grid grid-cols-2 gap-8 pt-6 pb-2 border-t border-slate-200 mt-4">
                <div className="text-center">
                  <div className="h-10 border-b border-slate-300 border-dashed" />
                  <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Recipient / Vendor Sign</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-slate-300 border-dashed flex items-end justify-center pb-1">
                    <span className="text-[10px] font-semibold text-slate-400 italic">Authorized Signature</span>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-700 mt-1">For {COMPANY_NAME}</p>
                </div>
              </div>

              {/* Footer note */}
              <div className="text-center pt-2 pb-1 border-t border-dashed border-slate-200">
                <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                  Official Computer Generated Document • {COMPANY_NAME}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(new Date().toISOString())}</p>
                <p className="text-[11px] font-extrabold text-slate-700 mt-1">Thank you for your business!</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Print-only CSS rules */}
      <style>{`
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt-card,
          #printable-receipt-card * {
            visibility: visible !important;
          }
          #printable-receipt-card {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 100% !important;
            max-width: 700px !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          .print\\:hidden,
          #receipt-modal-backdrop {
            display: none !important;
          }
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
        }
      `}</style>
    </>,
    document.body
  );
};

