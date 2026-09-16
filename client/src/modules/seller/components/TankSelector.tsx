import React from 'react';
import { Plus, Trash2, Box, Droplets, Minus } from 'lucide-react';

export interface TankLineItem {
  id: string;
  size: 500 | 1000;
  quantity: number;
  layers: number; // 3 - 6
  foam: 'none' | 'single' | 'double';
}

export interface TankSelectorProps {
  items: TankLineItem[];
  onChangeItems: (items: TankLineItem[]) => void;
}

export const TankSelector: React.FC<TankSelectorProps> = ({
  items,
  onChangeItems,
}) => {
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 0), 0);

  const handleAddVariant = () => {
    const newItem: TankLineItem = {
      id: Math.random().toString(36).substring(2, 9),
      size: 500,
      quantity: 1,
      layers: 4,
      foam: 'none',
    };
    onChangeItems([...items, newItem]);
  };

  const handleRemoveVariant = (id: string) => {
    if (items.length <= 1) return;
    onChangeItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<TankLineItem>) => {
    onChangeItems(
      items.map((it) => {
        if (it.id !== id) return it;
        return { ...it, ...updates };
      })
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Box className="w-4 h-4 text-sky-400 shrink-0" />
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider truncate">
              Tank Variants &amp; Line Items
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Strict sizes: 500L &amp; 1,000L (Layers 3–6, Foam: None / Single / Double)
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddVariant}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Variant</span>
        </button>
      </div>

      {/* Variants List */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const foamLabel = item.foam && item.foam !== 'none' ? ` • ${item.foam} foam` : '';

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-sm"
            >
              {/* Card Title & Delete */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-sky-400 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {item.size}L ({item.layers}L{foamLabel}) • {item.quantity} {item.quantity === 1 ? 'Unit' : 'Units'}
                  </span>
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(item.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                    title="Remove Variant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 1. Capacity Segmented Control */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Capacity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateItem(item.id, { size: 500 })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      item.size === 500
                        ? 'bg-sky-600 border-sky-500 text-white shadow-sm ring-1 ring-sky-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>500 Liters</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateItem(item.id, { size: 1000 })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      item.size === 1000
                        ? 'bg-sky-600 border-sky-500 text-white shadow-sm ring-1 ring-sky-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>1,000 Liters</span>
                  </button>
                </div>
              </div>

              {/* 2. Layers Selection (3 to 6) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Tank Layers: <span className="text-white font-bold">{item.layers} Layers</span>
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 4, 5, 6].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { layers: l })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        item.layers === l
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 ring-1 ring-sky-500/30'
                          : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {l}L
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Foam Selection (500L & 1000L) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Foam Type: <span className="text-emerald-400 font-bold uppercase">{item.foam || 'none'}</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'single', 'double'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { foam: f })}
                      className={`py-1 px-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer text-center ${
                        (item.foam || 'none') === f
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {f === 'none' ? 'None' : f === 'single' ? 'Single' : 'Double'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Quantity Stepper & Direct Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Quantity to Deliver
                  </label>
                  <div className="flex items-center border border-slate-800 rounded-xl bg-slate-950/90 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity !== undefined && item.quantity !== null ? item.quantity : ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleUpdateItem(item.id, { quantity: isNaN(val) ? 0 : val });
                      }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      className="w-14 h-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { quantity: (item.quantity || 0) + 1 })}
                      className="w-8 h-8 flex items-center justify-center text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold">Total Delivery Units:</span>
        <span className="font-mono font-extrabold text-sky-400">
          {totalUnits} {totalUnits === 1 ? 'Tank' : 'Tanks'} ({items.length} {items.length === 1 ? 'Variant' : 'Variants'})
        </span>
      </div>
    </div>
  );
};
