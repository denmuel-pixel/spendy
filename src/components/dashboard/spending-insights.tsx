"use client";

import { Lightbulb, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";

interface InsightsProps {
  totalThisMonth: number;
  dailyAverage: number;
  transactionCount: number;
  budgetLimit?: number;
  topCategory?: { name: string; percentage: number } | null;
}

export default function SpendingInsights({
  totalThisMonth,
  dailyAverage,
  transactionCount,
  budgetLimit = 5000000,
  topCategory,
}: InsightsProps) {
  const insights: { icon: React.ReactNode; message: string; color: string; bg: string }[] = [];

  // Budget insight
  if (totalThisMonth > 0 && budgetLimit > 0) {
    const budgetUsed = Math.round((totalThisMonth / budgetLimit) * 100);
    if (budgetUsed > 90) {
      insights.push({
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `⚠️ Budget bulan ini sudah terpakai ${budgetUsed}%. Hati-hati!`,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800",
      });
    } else if (budgetUsed > 70) {
      insights.push({
        icon: <TrendingUp className="w-4 h-4" />,
        message: `📊 Budget tersisa ${100 - budgetUsed}%. Mulai hemat!`,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
      });
    }
  }

  // Top category insight
  if (topCategory && topCategory.percentage > 35) {
    insights.push({
      icon: <Lightbulb className="w-4 h-4" />,
      message: `💡 Pengeluaran terbesar di "${topCategory.name}" (${topCategory.percentage}%). Coba evaluasi lagi.`,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800",
    });
  }

  // Daily average insight
  if (transactionCount > 0 && dailyAverage > 0) {
    const projectedMonthly = dailyAverage * 30;
    if (projectedMonthly > budgetLimit) {
      insights.push({
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `📈 Rata-rata Rp ${dailyAverage.toLocaleString("id-ID")}/hari. Proyeksi bulan ini bisa overshoot!`,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800",
      });
    } else {
      insights.push({
        icon: <Sparkles className="w-4 h-4" />,
        message: `✨ Rata-rata Rp ${dailyAverage.toLocaleString("id-ID")}/hari. Keuangan terkendali 👍`,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
      });
    }
  }

  // No transactions
  if (transactionCount === 0) {
    insights.push({
      icon: <Sparkles className="w-4 h-4" />,
      message: "👋 Mulai catat pengeluaran pertama Anda! Klik tombol 'Catat Pengeluaran' di atas.",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          💡 Spendy Insight
        </span>
      </div>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 p-3 rounded-xl border ${insight.bg}`}
        >
          <span className={`mt-0.5 ${insight.color}`}>{insight.icon}</span>
          <p className={`text-sm ${insight.color}`}>{insight.message}</p>
        </div>
      ))}
    </div>
  );
}
