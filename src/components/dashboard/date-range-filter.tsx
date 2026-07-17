"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface Props {
  onFilter: (range: DateRange | null) => void;
  isLoading?: boolean;
}

export default function DateRangeFilter({ onFilter, isLoading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const handleApply = () => {
    onFilter({ startDate, endDate });
    setIsOpen(false);
  };

  const handleReset = () => {
    const start = new Date();
    start.setDate(1);
    const end = new Date();
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    onFilter(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs">
          {new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          {" - "}
          {new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
        </span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border rounded-xl shadow-xl p-4 min-w-[260px]">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Dari Tanggal</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleApply}
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
