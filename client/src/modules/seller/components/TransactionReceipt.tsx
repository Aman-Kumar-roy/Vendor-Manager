import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Download, Droplets, ShieldCheck, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Transaction, Seller } from '../types';
import { apiClient } from '../../../services/api.client';

interface TransactionReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | any;
  seller?: Pick<Seller, 'name' | 'email' | 'phone' | 'address' | 'gstNumber'> | any;
}

interface NormalizedTankItem {
  size: 500 | 1000;
  quantity: number;
  layers: number | null;
  foam?: string;
}

const formatCurrency = (val: number = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val || 0)).replace('₹', '₹ ');

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({
  isOpen,
  onClose,
  transaction,
  seller,
}) => {
  if (!isOpen) return null;

  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverReceipt, setServerReceipt] = useState<any>(null);

  const txId = transaction?.id || (transaction as any)?._id || '';
  const receiptNo = `RCP-${txId.slice(-8).toUpperCase()}`;

  // Fetch live canonical receipt metadata from server
  useEffect(() => {
    if (!isOpen || !txId) return;
    setLoading(true);
    apiClient
      .get(`/transactions/${txId}/receipt`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setServerReceipt(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load server receipt metadata:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, txId]);

  const isDelivery = String(serverReceipt?.transaction?.type || transaction?.type || '').toUpperCase() === 'DELIVERY';

  const compName = serverReceipt?.company?.name || '';
  const compGst = serverReceipt?.company?.gst || '';
  const compPhone = serverReceipt?.company?.phone || '';
  const compAddress = serverReceipt?.company?.address || '';

  // Vendor resolution
  const vendorName =
    seller?.name ||
    serverReceipt?.seller?.name ||
    transaction?.sellerName ||
    transaction?.seller?.name ||
    'Valued Vendor';

  const vendorGst =
    seller?.gstNumber ||
    serverReceipt?.seller?.gstNumber ||
    transaction?.sellerGstNumber ||
    transaction?.seller?.gstNumber ||
    '';

  const vendorPhone =
    seller?.phone ||
    serverReceipt?.seller?.phone ||
    transaction?.sellerPhone ||
    transaction?.seller?.phone ||
    '';

  const vendorEmail =
    seller?.email ||
    serverReceipt?.seller?.email ||
    transaction?.sellerEmail ||
    transaction?.seller?.email ||
    '';

  const vendorAddress =
    seller?.address ||
    serverReceipt?.seller?.address ||
    transaction?.sellerAddress ||
    transaction?.seller?.address ||
    '';

  const txAmount = Number(serverReceipt?.transaction?.amount ?? transaction?.amount ?? 0);
  const txDate = serverReceipt?.issueDate || transaction?.date || new Date().toISOString();

  // Authoritative Ledger Dues (Single Source of Truth)
  const effectivePreviousDues =
    transaction?.previousDues !== undefined && transaction?.previousDues !== null
      ? Number(transaction.previousDues)
      : (serverReceipt?.previousDues ?? serverReceipt?.transaction?.previousDues ?? 0);

  const effectiveCurrentDues =
    transaction?.currentDues !== undefined && transaction?.currentDues !== null
      ? Number(transaction.currentDues)
      : (serverReceipt?.currentDues ??
         serverReceipt?.transaction?.currentDues ??
         (isDelivery ? effectivePreviousDues + txAmount : effectivePreviousDues - txAmount));

  // Parse structured tank items for delivery
  const rawTankItems =
    transaction?.tankItems && transaction.tankItems.length > 0
      ? transaction.tankItems
      : serverReceipt?.transaction?.tankItems && serverReceipt.transaction.tankItems.length > 0
      ? serverReceipt.transaction.tankItems
      : null;

  const normalizedItems: NormalizedTankItem[] = [];
  if (isDelivery) {
    if (rawTankItems && rawTankItems.length > 0) {
      rawTankItems.forEach((it: any) => {
        const qty = Number(it.quantity) || 0;
        if (qty > 0) {
          normalizedItems.push({
            size: Number(it.size) === 1000 ? 1000 : 500,
            quantity: qty,
            layers: it.layers ? Number(it.layers) : null,
            foam: it.foam && it.foam !== 'none' ? it.foam : undefined,
          });
        }
      });
    } else {
      const t500 = Number(transaction?.tank500 ?? serverReceipt?.transaction?.tank500 ?? 0);
      const t1000 = Number(transaction?.tank1000 ?? serverReceipt?.transaction?.tank1000 ?? 0);
      const t500Layers = transaction?.tank500_layers ?? serverReceipt?.transaction?.tank500_layers;
      const t1000Layers = transaction?.tank1000_layers ?? serverReceipt?.transaction?.tank1000_layers;
      const t500Foam = transaction?.tank500_foam ?? serverReceipt?.transaction?.tank500_foam;
      const t1000Foam = transaction?.tank1000_foam ?? serverReceipt?.transaction?.tank1000_foam;

      if (t500 > 0) {
        normalizedItems.push({
          size: 500,
          quantity: t500,
          layers: t500Layers ? Number(t500Layers) : null,
          foam: t500Foam || 'none',
        });
      }
      if (t1000 > 0) {
        normalizedItems.push({
          size: 1000,
          quantity: t1000,
          layers: t1000Layers ? Number(t1000Layers) : null,
          foam: t1000Foam || 'none',
        });
      }
    }
  }

  const totalUnits = normalizedItems.reduce((acc, it) => acc + it.quantity, 0);

  const getServerPdfUrl = () => {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const baseUrl = rawApiUrl.replace(/\/+$/, '');
    const token = localStorage.getItem('vasudha_admin_token') || localStorage.getItem('token') || '';
    return `${baseUrl}/transactions/${txId}/receipt/pdf?token=${encodeURIComponent(token)}`;
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const pdfUrl = getServerPdfUrl();
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Receipt-${receiptNo}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const vehicleNo = serverReceipt?.transaction?.vehicleNumber || transaction?.vehicleNumber;
  const payMode = serverReceipt?.transaction?.paymentMode || transaction?.paymentMode;
  const noteText = serverReceipt?.transaction?.note || transaction?.note;
  const parentDelivery = serverReceipt?.transaction?.parentDelivery || transaction?.parentDelivery;

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
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 !text-white text-xs font-bold transition-all shadow-glow cursor-pointer disabled:opacity-50"
                title="Download Official PDF Receipt"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Download width={14} height={14} className="w-3.5 h-3.5 text-white" style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} />
                )}
                <span className="text-white">{downloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Close"
              >
                <X width={16} height={16} className="w-4 h-4" style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* ── The printable receipt card ── */}
          <div
            id="printable-receipt-card"
            className="w-full max-w-lg bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none print:max-w-full border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {loading && !serverReceipt ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <p className="text-xs font-semibold text-slate-500">Loading official receipt from server...</p>
              </div>
            ) : (
              <>
                {/* Header band */}
                <div className="bg-slate-900 text-white px-6 py-5 print:py-4 print:bg-slate-900 print:text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 bg-white p-0.5 mt-0.5" style={{ width: 48, height: 48, minWidth: 48, minHeight: 48 }}>
                        <img src="/logo.jpg" alt="Vasudha Polymer Logo" width={44} height={44} className="w-full h-full object-cover rounded-lg" style={{ width: '100%', height: '100%', maxWidth: 44, maxHeight: 44 }} />
                      </div>
                      <div>
                        {compName ? <p className="text-xs uppercase tracking-widest text-brand-400 font-extrabold">{compName}</p> : null}
                        {compAddress ? <p className="text-sm font-bold text-slate-300 leading-tight mt-0.5">{compAddress}</p> : null}
                        {(compPhone || compGst) ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                            {compPhone ? <span>Phone: {compPhone}</span> : null}
                            {compPhone && compGst ? <span>•</span> : null}
                            {compGst ? <span className="font-mono font-bold text-slate-200">GSTIN: {compGst}</span> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        isDelivery ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isDelivery ? 'DELIVERY RECEIPT' : 'PAYMENT RECEIPT'}
                      </span>
                      <p className="text-xs text-slate-300 mt-1.5 font-mono font-extrabold">{receiptNo}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{formatDate(txDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">

                  {/* Seller / Vendor info */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold flex items-center gap-1">
                        <Building2 width={14} height={14} className="w-3.5 h-3.5 text-slate-400 shrink-0" style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} />
                        Seller / Vendor Details
                      </p>
                      {vendorGst && (
                        <span className="text-[11px] font-mono font-extrabold bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                          GSTIN: {vendorGst}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-extrabold text-slate-900">{vendorName}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-xs text-slate-600">
                      {vendorPhone && <p className="font-medium">Phone: <span className="font-bold text-slate-800">{vendorPhone}</span></p>}
                      {vendorEmail && <p>{vendorEmail}</p>}
                      {vendorAddress && <p className="sm:col-span-2">{vendorAddress}</p>}
                    </div>
                  </div>

                  {/* Transaction details table (Clean: dues are strictly in Financial Balance Card below) */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Transaction ID</span>
                      <span className="font-mono font-bold text-slate-800">{txId.toUpperCase()}</span>
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
                      <span className="text-slate-500 font-medium">{isDelivery ? 'Order Date' : 'Payment Date'}</span>
                      <span className="font-bold text-slate-800">{formatDate(txDate)}</span>
                    </div>

                    {isDelivery && vehicleNo && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Vehicle / Transport</span>
                        <span className="font-mono font-bold text-slate-800">{vehicleNo}</span>
                      </div>
                    )}

                    {!isDelivery && payMode && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Payment Mode</span>
                        <span className="font-bold text-emerald-900 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {String(payMode).replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    {noteText && (
                      <div className="flex items-start justify-between py-1.5 border-b border-slate-100 gap-4">
                        <span className="text-slate-500 font-medium shrink-0">Reference / Note</span>
                        <span className="text-slate-800 text-right font-medium">{noteText}</span>
                      </div>
                    )}

                    {!isDelivery && parentDelivery?.date && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Linked Delivery Order</span>
                        <span className="text-slate-800 font-semibold">{formatDate(parentDelivery.date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Tanks Delivered Table */}
                  {isDelivery && normalizedItems.length > 0 && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-100/90 px-3.5 py-2 flex items-center gap-1.5 border-b border-slate-200">
                        <Droplets width={14} height={14} className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-700">Itemized Tanks Delivered</span>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                            <th className="py-1.5 px-3 text-left w-8">#</th>
                            <th className="py-1.5 px-3 text-left">Capacity</th>
                            <th className="py-1.5 px-3 text-left">Specification</th>
                            <th className="py-1.5 px-3 text-right">Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {normalizedItems.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                              <td className="py-1.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-1.5 px-3 font-bold text-slate-900">{item.size}L Tank</td>
                              <td className="py-1.5 px-3 text-slate-600">
                                {item.layers ? `${item.layers} Layers` : 'Standard'}
                                {item.foam && item.foam !== 'none' ? ` • ${item.foam.charAt(0).toUpperCase() + item.foam.slice(1)} Foam` : ''}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-extrabold text-blue-700">{item.quantity} Units</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                            <td colSpan={3} className="py-2 px-3 text-xs">Total Delivered Quantity:</td>
                            <td className="py-2 px-3 text-right font-mono font-extrabold text-blue-800">{totalUnits} Tanks</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Amount box */}
                  <div className={`rounded-xl p-5 text-center shadow-sm ${isDelivery ? 'bg-indigo-50/90 border border-indigo-200' : 'bg-emerald-50/90 border border-emerald-200'}`}>
                    <p className="text-[11px] uppercase tracking-widest font-bold mb-1 text-slate-600">
                      {isDelivery ? 'Total Delivery Amount' : 'Amount Cleared / Settled'}
                    </p>
                    <p className={`text-3xl font-extrabold tracking-tight ${isDelivery ? 'text-indigo-900' : 'text-emerald-900'}`}>
                      {formatCurrency(txAmount)}
                    </p>
                  </div>

                  {/* Financial Balance Summary (Authoritative Ledger Dues - Exact App Parity) */}
                  <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center shadow-sm">
                    <div className="border-r border-slate-200 pr-2">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                        {effectivePreviousDues < 0 ? 'Previous Advance' : 'Previous Dues'}
                      </p>
                      <p className={`text-xs sm:text-sm font-extrabold mt-0.5 ${effectivePreviousDues < 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {effectivePreviousDues < 0 ? `+ ${formatCurrency(effectivePreviousDues)}` : formatCurrency(effectivePreviousDues)}
                      </p>
                    </div>
                    <div className="border-r border-slate-200 pr-2">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                        {isDelivery ? 'Delivery Bill' : 'Payment Paid'}
                      </p>
                      <p className={`text-xs sm:text-sm font-extrabold mt-0.5 ${isDelivery ? 'text-indigo-700' : 'text-emerald-700'}`}>
                        {isDelivery ? '+' : '-'}{formatCurrency(txAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                        {effectiveCurrentDues < 0 ? 'Closing Advance' : 'Closing Balance'}
                      </p>
                      <p className={`text-xs sm:text-sm font-black mt-0.5 ${effectiveCurrentDues < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {effectiveCurrentDues < 0 ? `+ ${formatCurrency(effectiveCurrentDues)}` : formatCurrency(effectiveCurrentDues)}
                      </p>
                    </div>
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
                      <p className="text-[10px] uppercase font-bold text-slate-700 mt-1">For {compName}</p>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="text-center pt-2 pb-1 border-t border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <CheckCircle2 width={14} height={14} className="w-3.5 h-3.5 text-emerald-600 inline" style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }} />
                      Official Computer Generated Document • {compName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(new Date().toISOString())}</p>
                    <p className="text-[11px] font-extrabold text-slate-700 mt-1">Thank you for your business!</p>
                  </div>
                </div>
              </>
            )}
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




