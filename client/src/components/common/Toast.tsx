import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3200,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-md animate-fade-in transition-all">
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
            : isError
            ? 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/40'
            : 'bg-slate-900/90 border-slate-700/60 text-slate-100 shadow-slate-950/40'
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-400 shrink-0" />}

        <span className="text-xs font-semibold tracking-wide flex-1">{message}</span>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
