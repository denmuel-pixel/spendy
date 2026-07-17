"use client";

import { formatCurrency } from "@/lib/currency";

interface BudgetGaugeProps {
  totalSpent: number;
  budgetLimit: number;
}

export default function BudgetGauge({ totalSpent, budgetLimit }: BudgetGaugeProps) {
  if (budgetLimit <= 0) return null;

  const percentage = Math.min(100, Math.round((totalSpent / budgetLimit) * 100));
  const remaining = Math.max(0, budgetLimit - totalSpent);
  const remainingPct = 100 - percentage;

  // SVG donut chart
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentage / 100) * circumference;
  const emptyLength = circumference - filledLength;

  // Color based on percentage
  const getColor = () => {
    if (percentage > 90) return "#EF4444"; // red
    if (percentage > 70) return "#F59E0B"; // amber
    return "#10B981"; // emerald
  };

  return (
    <div className="flex items-center gap-4">
      {/* Donut SVG */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg width="112" height="112" viewBox="0 0 140 140" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="14"
          />
          {/* Filled circle */}
          {percentage > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={getColor()}
              strokeWidth="14"
              strokeDasharray={`${filledLength} ${emptyLength}`}
              strokeLinecap="round"
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
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">Budget Bulanan</div>
        <div className="font-bold">{formatCurrency(budgetLimit)}</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor() }} />
          <span className="text-xs text-muted-foreground">
            Terpakai {formatCurrency(totalSpent)}
          </span>
        </div>
        {remaining > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              Sisa {formatCurrency(remaining)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
