"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface Props {
  onFilter: (range: DateRange | null) => void;
  isLoading?: boolean;
}

const PRESETS = [
  { label: "Bulan Ini", getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now);
    return { startDate: toISO(start), endDate: toISO(end) };
  }},
  { label: "Bulan Lalu", getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: toISO(start), endDate: toISO(end) };
  }},
  { label: "3 Bulan", getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const end = new Date(now);
    return { startDate: toISO(start), endDate: toISO(end) };
  }},
];

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function DateRangeFilter({ onFilter, isLoading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  });
  const [endDate, setEndDate] = useState(() => toISO(new Date()));
  const [activePreset, setActivePreset] = useState<string | null>("Bulan Ini");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handlePreset = (preset: typeof PRESETS[0]) => {
    const { startDate: s, endDate: e } = preset.getValue();
    setStartDate(s);
    setEndDate(e);
    setActivePreset(preset.label);
    onFilter({ startDate: s, endDate: e });
    setIsOpen(false);
  };

  const handleApply = () => {
    setActivePreset(null);
    onFilter({ startDate, endDate });
    setIsOpen(false);
  };

  const handleReset = () => {
    const now = new Date();
    const s = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    const e = toISO(now);
    setStartDate(s);
    setEndDate(e);
    setActivePreset("Bulan Ini");
    onFilter(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs">
          {formatDate(startDate)} — {formatDateFull(endDate)}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-[280px] animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 p-3 space-y-3">
            {/* Quick presets */}
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 px-0.5">
                Cepat
              </span>
              <div className="flex gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      activePreset === preset.label
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50" />

            {/* Custom date range */}
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-0.5">
                Kustom
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">Dari</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setActivePreset(null); }}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-medium">Sampai</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setActivePreset(null); }}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-bold text-muted-foreground bg-muted/50 hover:bg-muted transition-all border border-transparent cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-1.5 rounded-xl text-[11px] font-bold text-white bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 transition-all cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
