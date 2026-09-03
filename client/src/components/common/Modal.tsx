import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap: Record<string, string> = {
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "36rem",
    "2xl": "44rem",
  };
  const panelMaxWidth = maxWidthMap[maxWidth] ?? "32rem";

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        className="bg-slate-950/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Scrollable Container Shell */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto" }}
        onClick={onClose}
      >
        <div
          style={{ display: "flex", minHeight: "100%", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}
          onClick={onClose}
        >
          {/* Modal Card Panel */}
          <div
            className="relative w-full rounded-2xl shadow-card-elevated border border-slate-800/80 text-left animate-fade-in overflow-hidden transition-all duration-200"
            style={{
              maxWidth: panelMaxWidth,
              background: "var(--bg-card)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Shimmer */}
            <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div
                className="border-t border-slate-800/60 bg-slate-900/80 px-6 py-4 rounded-b-2xl"
                style={{ position: "sticky", bottom: 0, zIndex: 10 }}
              >
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
