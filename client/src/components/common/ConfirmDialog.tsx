import React from "react";
import ReactDOM from "react-dom";
import { AlertTriangle, Trash2, Info, CheckCircle2 } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmBtn: string;
  accentBar: string;
}> = {
  danger: {
    icon: <Trash2 className="w-5 h-5 text-rose-400" />,
    iconBg: "bg-rose-500/10 border border-rose-500/25 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    confirmBtn: "bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose",
    accentBar: "from-rose-500 to-rose-600",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    iconBg: "bg-amber-500/10 border border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    confirmBtn: "bg-amber-600 hover:bg-amber-500 text-white shadow-glow-amber",
    accentBar: "from-amber-500 to-amber-600",
  },
  info: {
    icon: <Info className="w-5 h-5 text-brand-400" />,
    iconBg: "bg-brand-500/10 border border-brand-500/25 shadow-[0_0_15px_rgba(12,140,233,0.2)]",
    confirmBtn: "bg-brand-600 hover:bg-brand-500 text-white shadow-glow",
    accentBar: "from-brand-500 to-brand-600",
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const cfg = variantConfig[variant];

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        style={{ zIndex: 10000 }}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 10001 }}
      >
        <div
          className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-card-elevated w-full max-w-sm animate-fade-in text-left overflow-hidden"
          style={{
            background: "var(--bg-card)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`h-1 w-full bg-gradient-to-r ${cfg.accentBar}`} />

          <div className="p-6 space-y-5">
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                {cfg.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {cancelLabel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${cfg.confirmBtn}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
