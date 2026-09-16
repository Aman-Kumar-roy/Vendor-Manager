import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { CreateTransactionDto, Transaction, PaymentMode } from '../types';
import {
  IndianRupee, Calendar, FileText, ArrowUpRight, ArrowDownLeft,
  CreditCard, Check, Edit2, AlertCircle,
} from 'lucide-react';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { TankSelector, TankLineItem } from './TankSelector';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  sellerName: string;
  onSubmit: (id: string, data: Partial<CreateTransactionDto>) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  sellerName,
  onSubmit,
}) => {
  const isDelivery = transaction ? String(transaction.type).toUpperCase() === 'DELIVERY' : true;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

  // Tank line items for delivery transactions
  const [tankLineItems, setTankLineItems] = useState<TankLineItem[]>([
    { id: '1', size: 500, quantity: 1, layers: 4, foam: 'none' },
  ]);

  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setAmount(transaction.amount ? String(transaction.amount) : '');
      setDate(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNote(transaction.note || '');
      setPaymentMode((transaction.paymentMode as PaymentMode) || 'CASH');

      if (transaction.tankItems && transaction.tankItems.length > 0) {
        setTankLineItems(
          transaction.tankItems.map((it, idx) => ({
            id: String(idx + 1),
            size: it.size === 1000 ? 1000 : 500,
            quantity: Number(it.quantity) || 1,
            layers: Number(it.layers) || 4,
            foam: it.foam || 'none',
          }))
        );
      } else {
        const items: TankLineItem[] = [];
        if (Number(transaction.tank500) > 0) {
          items.push({
            id: '1',
            size: 500,
            quantity: Number(transaction.tank500),
            layers: Number(transaction.tank500_layers) || 4,
            foam: transaction.tank500_foam || 'none',
          });
        }
        if (Number(transaction.tank1000) > 0) {
          items.push({
            id: items.length > 0 ? '2' : '1',
            size: 1000,
            quantity: Number(transaction.tank1000),
            layers: Number(transaction.tank1000_layers) || 4,
            foam: transaction.tank1000_foam || 'none',
          });
        }
        setTankLineItems(items.length > 0 ? items : [{ id: '1', size: 500, quantity: 1, layers: 4, foam: 'none' }]);
      }

      setAmountError(null);
      setDateError(null);
      setError(null);
    }
  }, [isOpen, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setAmountError(null);
    setDateError(null);
    setError(null);

    let hasError = false;

    const parsedAmount = parseFloat(amount);
    if (!amount.trim()) {
      setAmountError('Amount is required');
      hasError = true;
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Amount must be a positive number greater than 0');
      hasError = true;
    }

    if (!date) {
      setDateError('Date is required');
      hasError = true;
    }

    if (isDelivery) {
      for (let i = 0; i < tankLineItems.length; i++) {
        const it = tankLineItems[i];
        if (!it.quantity || it.quantity <= 0) {
          setError(`Tank Variant #${i + 1}: Please enter a valid quantity greater than 0.`);
          hasError = true;
          break;
        }
        if (!it.layers || it.layers < 3 || it.layers > 6) {
          setError(`Tank Variant #${i + 1}: Layers must be between 3 and 6.`);
          hasError = true;
          break;
        }
      }
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      const payload: Partial<CreateTransactionDto> = {
        amount: Math.round(parsedAmount * 100) / 100,
        date,
        note: note.trim() || undefined,
      };

      if (isDelivery) {
        payload.tankItems = tankLineItems.map((it) => ({
          size: it.size,
          quantity: it.quantity,
          layers: it.layers,
          foam: it.foam || 'none',
        }));
      } else {
        payload.paymentMode = paymentMode;
      }

      await onSubmit(transaction.id, payload);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${isDelivery ? 'Delivery' : 'Payment'} Transaction`}
      subtitle={`Vendor: ${sellerName} • Voucher #${transaction.id.slice(-8).toUpperCase()}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start space-x-2.5 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Type Indicator */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isDelivery ? (
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {isDelivery ? 'Delivery (Tank Shipment)' : 'Payment Settlement'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isDelivery ? 'Items & unit breakdown update' : `Mode: ${paymentMode}`}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${
            isDelivery ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}>
            {transaction.type}
          </span>
        </div>

        {/* Tank Units / Selector (Delivery only) */}
        {isDelivery && (
          <TankSelector
            items={tankLineItems}
            onChangeItems={setTankLineItems}
          />
        )}

        {/* Amount & Date Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Amount (₹) <span className="text-rose-400">*</span>
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
                placeholder="0.00"
                className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-mono font-bold ${
                  amountError
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                }`}
              />
            </div>
            {amountError && <p className="text-xs text-rose-400 mt-1 font-medium">{amountError}</p>}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Transaction Date <span className="text-rose-400">*</span>
            </label>
            <CustomDatePicker
              value={date}
              onChange={(newDate) => {
                setDate(newDate);
                setDateError(null);
              }}
              error={dateError || undefined}
            />
            {dateError && <p className="text-xs text-rose-400 mt-1 font-medium">{dateError}</p>}
          </div>
        </div>

        {/* Payment Mode Selection (Payment only) */}
        {!isDelivery && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{mode.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Note / Memo */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Reference / Note <span className="text-slate-500 normal-case">(Optional)</span>
            </label>
            <span className="text-[10px] text-slate-500">{note.length}/500</span>
          </div>
          <div className="relative">
            <textarea
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Invoice #1024, Bank Ref ID, driver note..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-glow transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
