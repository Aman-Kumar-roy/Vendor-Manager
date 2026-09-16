import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { CreateTransactionDto, TransactionType, Transaction, PaymentMode } from '../types';
import {
  PlusCircle, IndianRupee, Calendar, FileText, ArrowUpRight, ArrowDownLeft,
  Link2, CreditCard, ChevronDown, Check,
} from 'lucide-react';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { TankSelector, TankLineItem } from './TankSelector';

const EMPTY_DELIVERIES: Transaction[] = [];

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  deliveries?: Transaction[];
  initialDeliveryId?: string;
  initialType?: TransactionType;
  onSubmit: (data: CreateTransactionDto) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  deliveries = EMPTY_DELIVERIES,
  initialDeliveryId,
  initialType,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>(initialType || (initialDeliveryId ? 'PAYMENT' : 'DELIVERY'));
  const [parentId, setParentId] = useState<string>(initialDeliveryId || '');
  const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);
  const linkDropdownRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Strictly tank sizes: 500, 1000 with flexible line items, layers (3-6) & foam matching app flow
  const [tankLineItems, setTankLineItems] = useState<TankLineItem[]>([
    { id: '1', size: 500, quantity: 1, layers: 4, foam: 'none' },
  ]);

  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialDeliveryId) {
        setType('PAYMENT');
        setParentId(initialDeliveryId);
        const targetOrder = deliveries.find((d) => d.id === initialDeliveryId);
        if (targetOrder) {
          const due = targetOrder.remainingDue !== undefined ? targetOrder.remainingDue : targetOrder.amount;
          if (due > 0) {
            setAmount(due.toFixed(2));
          }
        }
      } else {
        setType(initialType || 'DELIVERY');
        setParentId('');
        setAmount('');
      }
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setPaymentMode('CASH');
      setVehicleNumber('');
      setTankLineItems([{ id: '1', size: 500, quantity: 1, layers: 4, foam: 'none' }]);
      setAmountError(null);
      setDateError(null);
      setError(null);
    } else {
      setIsLinkDropdownOpen(false);
      setAmountError(null);
      setDateError(null);
      setError(null);
    }
  }, [isOpen]);

  const handleSelectType = (newType: TransactionType) => {
    setType(newType);
    setAmountError(null);
    setDateError(null);
    setError(null);
    if (newType === 'DELIVERY') {
      setParentId('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(e.target as Node)) {
        setIsLinkDropdownOpen(false);
      }
    };
    if (isLinkDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLinkDropdownOpen]);

  // Filter only DELIVERY transactions for linking payments
  const deliveryOrders = deliveries.filter((t) => String(t.type).toUpperCase() === 'DELIVERY');
  const selectedDelivery = deliveryOrders.find((d) => d.id === parentId);

  const total500 = tankLineItems
    .filter((t) => t.size === 500)
    .reduce((acc, t) => acc + (t.quantity || 0), 0);
  const total1000 = tankLineItems
    .filter((t) => t.size === 1000)
    .reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalUnits = total500 + total1000;

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
      const formattedItems = tankLineItems
        .filter((t) => (t.quantity || 0) > 0)
        .map((t) => ({
          size: t.size,
          quantity: t.quantity,
          layers: t.layers,
          foam: t.foam || ('none' as const),
        }));

      await onSubmit({
        sellerId,
        parentId: type === 'PAYMENT' && parentId ? parentId : undefined,
        type,
        amount: numAmount,
        date: date ? new Date(date).toISOString() : undefined,
        note: note.trim() || undefined,
        tank500: type === 'DELIVERY' ? total500 : 0,
        tank1000: type === 'DELIVERY' ? total1000 : 0,
        tank500_layers: type === 'DELIVERY' && total500 > 0 ? (formattedItems.find(i => i.size === 500)?.layers || 4) : undefined,
        tank500_foam: type === 'DELIVERY' && total500 > 0 ? (formattedItems.find(i => i.size === 500)?.foam || 'none') : undefined,
        tank1000_layers: type === 'DELIVERY' && total1000 > 0 ? (formattedItems.find(i => i.size === 1000)?.layers || 4) : undefined,
        tank1000_foam: type === 'DELIVERY' && total1000 > 0 ? (formattedItems.find(i => i.size === 1000)?.foam || 'none') : undefined,
        tankItems: type === 'DELIVERY' && formattedItems.length > 0 ? formattedItems : undefined,
        paymentMode: type === 'PAYMENT' ? paymentMode : undefined,
        vehicleNumber: type === 'DELIVERY' && vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : undefined,
      });
      // Reset state on success
      setAmount('');
      setNote('');
      setParentId('');
      setType('DELIVERY');
      setTankLineItems([{ id: '1', size: 500, quantity: 1, layers: 4, foam: 'none' }]);
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
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
      <form id="add-transaction-form" onSubmit={handleSubmit} noValidate className="space-y-4 pb-16 sm:pb-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Transaction Type Selector Pills */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Transaction Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectType('DELIVERY')}
              className={`flex items-center justify-center space-x-2 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${type === 'DELIVERY'
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm ring-1 ring-indigo-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
            >
              <ArrowUpRight className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>DELIVERY (Goods Delivered)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('PAYMENT')}
              className={`flex items-center justify-center space-x-2 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${type === 'PAYMENT'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PAYMENT (Paid / Settled)</span>
            </button>
          </div>
        </div>        {/* ── Tank Variants & Line Items (Strictly 500L & 1000L) ── */}
        {type === 'DELIVERY' && (
          <div className="animate-fade-in space-y-3">
            <TankSelector
              items={tankLineItems}
              onChangeItems={setTankLineItems}
            />

            {/* Vehicle Number Input for Delivery */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Vehicle / Transport Number (Optional)
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DL 01 AB 1234"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 uppercase transition-colors"
              />
            </div>
          </div>
        )}

        {/* Payment Mode Selector (PAYMENT only) */}
        {type === 'PAYMENT' && (
          <div className="animate-fade-in space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
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
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
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
          <div className={`animate-fade-in ${isLinkDropdownOpen ? 'relative z-40' : 'relative z-10'}`} ref={linkDropdownRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Link Payment to Specific Delivery Order (Optional)
            </label>
            <div className={`relative ${isLinkDropdownOpen ? 'z-40' : 'z-10'}`}>
              {/* Custom Trigger Button matching project style */}
              <div
                onClick={() => setIsLinkDropdownOpen((prev) => !prev)}
                className={`w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer flex items-center justify-between select-none ${
                  isLinkDropdownOpen
                    ? 'border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.25)]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  {selectedDelivery ? (
                    <span className="font-bold text-slate-100 flex items-center gap-1.5 truncate">
                      <span>Delivery ({new Date(selectedDelivery.date).toLocaleDateString('en-IN')})</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-indigo-300 font-mono">{formatCurrency(selectedDelivery.amount)}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-amber-400 font-mono">
                        Due: {formatCurrency(selectedDelivery.remainingDue ?? selectedDelivery.amount)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      -- General Account Payment (Unlinked) --
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isLinkDropdownOpen ? 'rotate-180 text-brand-400' : ''
                  }`}
                />
              </div>

              {/* Custom Dropdown Popover */}
              {isLinkDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-full bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl animate-fade-in text-slate-100 max-h-60 overflow-y-auto space-y-1">
                  {/* General Account Payment Option */}
                  <div
                    onClick={() => {
                      setParentId('');
                      setIsLinkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                      !parentId
                        ? 'bg-brand-500/15 border border-brand-500/30 text-brand-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>-- General Account Payment (Unlinked) --</span>
                    </div>
                    {!parentId && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                  </div>

                  {/* Delivery Orders */}
                  {deliveryOrders.map((d) => {
                    const isSelected = parentId === d.id;
                    const remaining = d.remainingDue !== undefined ? d.remainingDue : d.amount;
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setParentId(d.id);
                          setIsLinkDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-brand-500/15 border border-brand-500/30 text-brand-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              Delivery #{d.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-indigo-300 font-bold">Total: {formatCurrency(d.amount)}</span>
                            <span className="text-slate-500">•</span>
                            <span className={remaining > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                              Remaining: {formatCurrency(remaining)}
                            </span>
                            {d.note && (
                              <span className="text-slate-400 truncate max-w-[140px]">[{d.note}]</span>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Select a delivery order to associate partial payments directly with that delivery.
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                amountError
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {amountError && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{amountError}</p>
          )}
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Reference / Note (Optional)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">{note.length}/500</span>
          </div>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="e.g. Delivery Challan #DC-902, dispatch notes, payment remarks..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Pre-Submission Live Summary Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Transaction Summary</span>
            <span className={type === 'DELIVERY' ? 'text-indigo-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {type === 'DELIVERY' ? 'Goods Delivery' : 'Payment Settlement'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vendor:</span>
              <span className="font-bold text-white truncate max-w-[200px]">{sellerName}</span>
            </div>

            {type === 'DELIVERY' && totalUnits > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 shrink-0">Tanks Spec:</span>
                <div className="font-mono text-right text-sky-300 font-bold flex flex-wrap justify-end gap-1.5 break-words max-w-full">
                  {tankLineItems
                    .filter((t) => (t.quantity || 0) > 0)
                    .map((t, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[11px]"
                      >
                        {t.quantity}× {t.size}L ({t.layers}L{t.foam && t.foam !== 'none' ? `, ${t.foam}` : ''})
                      </span>
                    ))}
                </div>
              </div>
            )}

            {type === 'DELIVERY' && totalUnits > 0 && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400">Total Units:</span>
                <span className="font-mono font-extrabold text-sky-400">{totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-sm">
              <span className="font-bold text-slate-300">Total Amount:</span>
              <span className="font-mono font-extrabold text-white">
                {parseFloat(amount) > 0 ? formatCurrency(parseFloat(amount)) : '₹ 0.00'}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

