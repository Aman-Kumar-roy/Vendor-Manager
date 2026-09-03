import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface CustomMonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const formatMonthLabel = (ym: string) => {
  if (!ym || !ym.includes("-")) return "Select Month";
  const [y, m] = ym.split("-");
  const monthIdx = parseInt(m, 10) - 1;
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return ym;
  return `${MONTH_NAMES[monthIdx]} ${y}`;
};

export const CustomMonthPicker: React.FC<CustomMonthPickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [yearStr, monthStr] = value && value.includes("-") ? value.split("-") : [String(new Date().getFullYear()), String(new Date().getMonth() + 1).padStart(2, "0")];
  const [viewYear, setViewYear] = useState(() => Number(yearStr) || new Date().getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value.includes("-")) {
      const [y] = value.split("-");
      if (y) setViewYear(Number(y));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const mStr = String(monthIndex + 1).padStart(2, "0");
    const newYM = `${viewYear}-${mStr}`;
    onChange(newYM);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-between gap-3 bg-slate-900 border rounded-xl px-4 py-2 cursor-pointer select-none transition-all ${
          isOpen
            ? "border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.25)]"
            : "border-slate-800 hover:border-brand-500/50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-xs font-extrabold text-white tracking-tight">
            {formatMonthLabel(value)}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-brand-400" : ""}`} />
      </div>

      {/* Popover Month Grid */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-64 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 shadow-2xl animate-fade-in text-slate-100 select-none">
          {/* Header Year Navigator */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-extrabold text-white tracking-tight">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-2">
            {SHORT_MONTHS.map((mName, idx) => {
              const mVal = String(idx + 1).padStart(2, "0");
              const targetYM = `${viewYear}-${mVal}`;
              const isSelected = value === targetYM;

              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    isSelected
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-glow-sm scale-105"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
