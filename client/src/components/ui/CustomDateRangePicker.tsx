import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, ArrowRight } from "lucide-react";
import { CustomDatePicker } from "./CustomDatePicker";

export interface DateRangeValue {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

interface CustomDateRangePickerProps {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  className?: string;
}

const formatDateShort = (ymd: string) => {
  if (!ymd || !ymd.includes("-")) return "";
  const [y, m, d] = ymd.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
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

  const presets = [
    {
      id: "this_month",
      label: "This Month",
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: toYMD(start),
          endDate: toYMD(end),
          label: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        };
      },
    },
    {
      id: "last_month",
      label: "Last Month",
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: toYMD(start),
          endDate: toYMD(end),
          label: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
        };
      },
    },
    {
      id: "last_7_days",
      label: "Last 7 Days",
      getRange: () => {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 6);
        return {
          startDate: toYMD(start),
          endDate: toYMD(now),
          label: "Last 7 Days",
        };
      },
    },
    {
      id: "last_30_days",
      label: "Last 30 Days",
      getRange: () => {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 29);
        return {
          startDate: toYMD(start),
          endDate: toYMD(now),
          label: "Last 30 Days",
        };
      },
    },
    {
      id: "this_year",
      label: "This Year",
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          startDate: toYMD(start),
          endDate: toYMD(end),
          label: `Year ${now.getFullYear()}`,
        };
      },
    },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    const range = preset.getRange();
    onChange(range);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (!tempStart || !tempEnd) return;
    let s = tempStart;
    let e = tempEnd;
    if (s > e) {
      const t = s;
      s = e;
      e = t;
    }
    onChange({
      startDate: s,
      endDate: e,
      label: `${formatDateShort(s)} – ${formatDateShort(e)}`,
    });
    setIsOpen(false);
  };

  const displayLabel = value.label || (
    value.startDate && value.endDate
      ? `${formatDateShort(value.startDate)} – ${formatDateShort(value.endDate)}`
      : "Select Date Range"
  );

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
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-400" : ""
          }`}
        />
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl animate-fade-in text-slate-100 select-none">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Quick Date Presets
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {presets.map((preset) => {
              const isSelected = value.label === preset.label || (
                preset.id === "this_month" && value.label.includes(new Date().getFullYear().toString()) && !value.label.includes("–")
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                      : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Section */}
          <div className="border-t border-slate-800 pt-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Custom Date Range
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Start Date
                </label>
                <CustomDatePicker
                  value={tempStart}
                  onChange={(val) => setTempStart(val)}
                  placeholder="Select Start Date"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  End Date
                </label>
                <CustomDatePicker
                  value={tempEnd}
                  onChange={(val) => setTempEnd(val)}
                  placeholder="Select End Date"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  disabled={!tempStart || !tempEnd}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-40 shadow-glow transition-all cursor-pointer"
                >
                  <span>Apply Range</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
