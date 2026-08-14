import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { CreateTransactionDto, TransactionType, Transaction } from '../types';
import { PlusCircle, IndianRupee, Calendar, FileText, ArrowUpRight, ArrowDownLeft, Link2, Droplets } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  deliveries?: Transaction[];
  onSubmit: (data: CreateTransactionDto) => Promise<void>;
}

const TANK_OPTIONS: { value: '500' | '1000' | '2000'; label: string; sublabel: string }[] = [
  { value: '500',  label: '500 L',   sublabel: 'Small tank' },
  { value: '1000', label: '1,000 L', sublabel: 'Medium tank' },
  { value: '2000', label: '2,000 L', sublabel: 'Large tank' },
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  deliveries = [],
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>('DELIVERY');
  const [parentId, setParentId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [tank500, setTank500] = useState<string>('');
  const [tank1000, setTank1000] = useState<string>('');
  const [tank2000, setTank2000] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter only DELIVERY transactions for linking payments
  const deliveryOrders = deliveries.filter((t) => String(t.type).toUpperCase() === 'DELIVERY');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive transaction amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        sellerId,
        parentId: type === 'PAYMENT' && parentId ? parentId : undefined,
        type,
        amount: numAmount,
        date: date ? new Date(date).toISOString() : undefined,
        note: note.trim() || undefined,
        tank500: type === 'DELIVERY' ? parseInt(tank500 || '0', 10) || 0 : 0,
        tank1000: type === 'DELIVERY' ? parseInt(tank1000 || '0', 10) || 0 : 0,
        tank2000: type === 'DELIVERY' ? parseInt(tank2000 || '0', 10) || 0 : 0,
      });
      // Reset state on success
      setAmount('');
      setNote('');
      setParentId('');
      setType('DELIVERY');
      setTank500('');
      setTank1000('');
      setTank2000('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val).replace('₹', '₹ ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Transaction"
      subtitle={`Log a goods delivery or partial payment settlement for ${sellerName}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            form="add-transaction-form"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-glow disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>Recording...</span>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Transaction</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Transaction Type Selector Pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Transaction Type <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType('DELIVERY'); setParentId(''); }}
              className={`flex items-center justify-center space-x-2 p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                type === 'DELIVERY'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-glow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>DELIVERY (Goods Delivered)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('PAYMENT')}
              className={`flex items-center justify-center space-x-2 p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                type === 'PAYMENT'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-glow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PAYMENT (Paid / Settled)</span>
            </button>
          </div>
        </div>

        {/* ── Tank Size Inputs (DELIVERY only) ── */}
        {type === 'DELIVERY' && (
          <div className="animate-fade-in space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Tank Quantities Delivered (Optional)
              </span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">500 L Tank</label>
                <input
                  type="number"
                  min="0"
                  value={tank500}
                  onChange={(e) => setTank500(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">1,000 L Tank</label>
                <input
                  type="number"
                  min="0"
                  value={tank1000}
                  onChange={(e) => setTank1000(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">2,000 L Tank</label>
                <input
                  type="number"
                  min="0"
                  value={tank2000}
                  onChange={(e) => setTank2000(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Delivery Link for PAYMENT */}
        {type === 'PAYMENT' && deliveryOrders.length > 0 && (
          <div className="animate-fade-in">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Link Payment to Specific Delivery Order (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Link2 className="w-4 h-4" />
              </div>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- General Account Payment (Unlinked) --</option>
                {deliveryOrders.map((d) => {
                  const remaining = d.remainingDue !== undefined ? d.remainingDue : d.amount;
                  return (
                    <option key={d.id} value={d.id}>
                      Delivery ({new Date(d.date).toLocaleDateString('en-US')}) - Total: {formatCurrency(d.amount)} | Remaining: {formatCurrency(remaining)} {d.note ? `[${d.note}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Select a delivery order to associate partial payments directly with that delivery.
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Amount (₹) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Transaction Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Note / Memo Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Reference / Note (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Partial Payment ref #WT-204"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
