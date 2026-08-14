import React from 'react';
import { Package, Layers, Sparkles } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  return (
    <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-xl mx-auto my-8 space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
        <Package className="w-8 h-8" />
      </div>
      <div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20 mb-2">
          <Sparkles className="w-3 h-3" /> API v2 Modular Placeholder
        </span>
        <h2 className="text-xl font-extrabold text-white">Product Catalog Module</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          This feature route is registered in the <code className="text-brand-400">navigation.config.ts</code> array. You can instantly plug in product inventory APIs without refactoring the admin shell layout.
        </p>
      </div>
    </div>
  );
};
