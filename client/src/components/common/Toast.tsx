import React, { useEffect, useState } from 'react';
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
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 25);

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-auto animate-toast-in">
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all ${
          isSuccess
            ? 'bg-slate-950/92 border-emerald-500/35 shadow-emerald-950/60 ring-1 ring-emerald-500/20'
            : isError
            ? 'bg-slate-950/92 border-rose-500/35 shadow-rose-950/60 ring-1 ring-rose-500/20'
            : 'bg-slate-950/92 border-sky-500/35 shadow-sky-950/60 ring-1 ring-sky-500/20'
        }`}
      >
        {/* Ambient Top Glow Line */}
        <div
          className={`absolute top-0 inset-x-0 h-[2px] ${
            isSuccess
              ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
              : isError
              ? 'bg-gradient-to-r from-transparent via-rose-400 to-transparent'
              : 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
          }`}
        />

        <div className="flex items-center space-x-3.5 p-3.5">
          {/* Glowing Icon Badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isSuccess
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : isError
                ? 'bg-rose-500/15 border-rose-400/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                : 'bg-sky-500/15 border-sky-400/30 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.25)]'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />}
            {isError && <AlertCircle className="w-5 h-5 stroke-[2.2]" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 stroke-[2.2]" />}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isError
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-sky-500/20 text-sky-300'
                }`}
              >
                {isSuccess ? 'Success' : isError ? 'Attention' : 'Notice'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug break-words">
              {message}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Countdown Progress Bar */}
        <div className="h-[2px] w-full bg-slate-800/80">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              isSuccess
                ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                : isError
                ? 'bg-gradient-to-r from-rose-500 to-red-300'
                : 'bg-gradient-to-r from-sky-500 to-cyan-300'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
