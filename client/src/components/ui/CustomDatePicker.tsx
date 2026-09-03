import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const formatDisplayDate = (ymd: string) => {
  if (!ymd || !ymd.includes("-")) return "";
  const [year, month, day] = ymd.split("-");
  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
};

const toYMD = (year: number, monthIndex: number, day: number) => {
  const y = String(year);
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select date...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial state or fallback to today
  const parsedDate = value && value.includes("-") ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(() => (isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (isNaN(parsedDate.getTime()) ? new Date().getMonth() : parsedDate.getMonth()));

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize view state when value changes
  useEffect(() => {
    if (value && value.includes("-")) {
      const [y, m] = value.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [value]);

  // Handle click outside to close popover
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

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = toYMD(viewYear, viewMonth, day);
    onChange(selected);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate());
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(todayYMD);
    setIsOpen(false);
  };

  // Days calculations
  const firstDayOfMonthIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-based index
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayDate = new Date();
  const todayYMD = toYMD(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Trigger */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all cursor-pointer flex items-center justify-between select-none ${
          error
            ? "border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
            : isOpen
            ? "border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.25)]"
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <span className={value ? "font-bold text-slate-100 font-mono tracking-tight" : "text-slate-500 font-medium"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-400" : ""}`} />
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-72 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 shadow-2xl animate-fade-in text-slate-100 select-none">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-extrabold text-white tracking-tight">
              {MONTH_NAMES[viewMonth]} <span className="text-brand-400">{viewYear}</span>
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[10px] font-extrabold uppercase text-slate-500">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Prev month padding days */}
            {Array.from({ length: firstDayOfMonthIndex }).map((_, idx) => {
              const prevDayNum = daysInPrevMonth - firstDayOfMonthIndex + idx + 1;
              return (
                <span key={`prev-${idx}`} className="py-2 text-slate-700 font-medium">
                  {prevDayNum}
                </span>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const currentYMD = toYMD(viewYear, viewMonth, dayNum);
              const isSelected = value === currentYMD;
              const isToday = todayYMD === currentYMD;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`py-1.5 rounded-xl font-bold transition-all text-xs ${
                    isSelected
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-glow-sm scale-105"
                      : isToday
                      ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/50 hover:bg-brand-500/30"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleToday}
              className="text-brand-400 hover:text-brand-300 font-bold transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
