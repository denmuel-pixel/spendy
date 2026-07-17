"use client";

import { useState } from "react";
import { Settings2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import { Toaster, toast } from "sonner";

interface BudgetGaugeProps {
  totalSpent: number;
  budgetLimit: number;
  onBudgetChange: (newBudget: number) => void;
}

export default function BudgetGauge({ totalSpent, budgetLimit, onBudgetChange }: BudgetGaugeProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  if (budgetLimit <= 0) return null;

  const percentage = Math.min(100, Math.round((totalSpent / budgetLimit) * 100));
  const remaining = Math.max(0, budgetLimit - totalSpent);

  const getColor = () => {
    if (percentage > 90) return "#EF4444";
    if (percentage > 70) return "#F59E0B";
    return "#10B981";
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentage / 100) * circumference;
  const emptyLength = circumference - filledLength;

  const startEdit = () => {
    setEditValue(String(Math.round(budgetLimit)));
    setEditing(true);
  };

  const saveBudget = async () => {
    const raw = editValue.replace(/\D/g, "");
    const val = parseInt(raw);
    if (!val || val < 10000) {
      toast.error("Minimal budget Rp 10.000");
      return;
    }
    try {
      const res = await fetch("/api/user/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onBudgetChange(val);
      toast.success(`Budget diubah jadi ${formatCurrency(val)}`);
      setEditing(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan";
      toast.error(msg);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex items-center gap-4">
        {/* Donut SVG */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg width="112" height="112" viewBox="0 0 140 140" className="transform -rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
            {percentage > 0 && (
              <circle
                cx="70" cy="70" r={radius} fill="none" stroke={getColor()} strokeWidth="14"
                strokeDasharray={`${filledLength} ${emptyLength}`} strokeLinecap="round"
                className="transition-all duration-700"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{percentage}%</span>
            <span className="text-[9px] text-muted-foreground">Terpakai</span>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Budget Bulanan</span>
            {!editing && (
              <button type="button" onClick={startEdit} className="text-muted-foreground/50 hover:text-emerald-500 transition-colors">
                <Settings2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Rp</span>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ""))}
                  className="pl-7 h-8 text-sm font-bold rounded-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                />
              </div>
              <button type="button" onClick={saveBudget} className="text-emerald-500 hover:text-emerald-600 p-1">
                <Check className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="font-bold">{formatCurrency(budgetLimit)}</div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor() }} />
            <span className="text-xs text-muted-foreground">Terpakai {formatCurrency(totalSpent)}</span>
          </div>
          {remaining > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Sisa {formatCurrency(remaining)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
