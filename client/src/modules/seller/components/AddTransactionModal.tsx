import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { CreateTransactionDto, TransactionType, Transaction, PaymentMode } from '../types';
import { PlusCircle, IndianRupee, Calendar, FileText, ArrowUpRight, ArrowDownLeft, Link2, CreditCard } from 'lucide-react';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  deliveries?: Transaction[];
  onSubmit: (data: CreateTransactionDto) => Promise<void>;
}

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Standard Tank Capacities: 500L, 1000L, 2000L ONLY
  const [tank500, setTank500] = useState<string>('');
  const [tank1000, setTank1000] = useState<string>('');
  const [tank2000, setTank2000] = useState<string>('');

  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter only DELIVERY transactions for linking payments
  const deliveryOrders = deliveries.filter((t) => String(t.type).toUpperCase() === 'DELIVERY');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAmountError(null);
    setDateError(null);

    let hasError = false;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter a valid positive transaction amount');
      hasError = true;
    }

    if (!date) {
      setDateError('Please select a valid transaction date');
      hasError = true;
    }

    if (hasError) return;

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
        paymentMode: type === 'PAYMENT' ? paymentMode : undefined,
        vehicleNumber: type === 'DELIVERY' && vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : undefined,
      });
      // Reset state on success
      setAmount('');
      setNote('');
      setParentId('');
      setType('DELIVERY');
      setTank500('');
      setTank1000('');
      setTank2000('');
      setVehicleNumber('');
      setPaymentMode('CASH');
      setAmountError(null);
      setDateError(null);
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
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-transaction-form"
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-glow cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>{isSubmitting ? 'Recording...' : 'Submit Transaction'}</span>
          </button>
        </div>
      }
    >
      <form id="add-transaction-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Transaction Type Selector Pills */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Transaction Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType('DELIVERY'); setParentId(''); }}
              className={`flex items-center justify-center space-x-2 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${type === 'DELIVERY'
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/30'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <ArrowUpRight className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>DELIVERY (Goods Delivered)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('PAYMENT')}
              className={`flex items-center justify-center space-x-2 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${type === 'PAYMENT'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>PAYMENT (Paid / Settled)</span>
            </button>
          </div>
        </div>

        {/* ── Tank Size Inputs (500L, 1000L, 2000L ONLY) ── */}
        {type === 'DELIVERY' && (
          <div className="animate-fade-in space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tank Quantities (Units)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  500L Tanks
                </label>
                <input
                  type="number"
                  min="0"
                  value={tank500}
                  onChange={(e) => setTank500(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="0"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  1,000L Tanks
                </label>
                <input
                  type="number"
                  min="0"
                  value={tank1000}
                  onChange={(e) => setTank1000(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="0"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  2,000L Tanks
                </label>
                <input
                  type="number"
                  min="0"
                  value={tank2000}
                  onChange={(e) => setTank2000(e.target.value)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="0"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Mode Selector (PAYMENT only) */}
        {type === 'PAYMENT' && (
          <div className="animate-fade-in space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                Payment Mode
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${paymentMode === mode
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conditional Delivery Link for PAYMENT */}
        {type === 'PAYMENT' && deliveryOrders.length > 0 && (
          <div className="animate-fade-in">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Link Payment to Specific Delivery Order (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Link2 className="w-4 h-4" />
              </div>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
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
            <p className="text-[11px] text-slate-500 mt-1">
              Select a delivery order to associate partial payments directly with that delivery.
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountError(null);
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="0.00"
              className={`w-full bg-white dark:bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                amountError
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {amountError && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{amountError}</p>
          )}
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Transaction Date <span className="text-rose-500">*</span>
          </label>
          <CustomDatePicker
            value={date}
            onChange={(val) => {
              setDate(val);
              setDateError(null);
            }}
            error={dateError}
          />
          {dateError && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{dateError}</p>
          )}
        </div>

        {/* Note / Memo Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Reference / Note (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Delivery Challan #DC-902, 500L x 5"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
