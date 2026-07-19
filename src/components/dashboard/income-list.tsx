"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/currency";

export default function IncomeList({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  const { categories } = useCategories();
  const { expenses, pagination, isLoading, fetchExpenses } = useExpenses();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchExpenses({ page, limit: 5, type: "income", startDate, endDate });
  }, [page, startDate, endDate, fetchExpenses]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Belum ada pemasukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {expenses.map((expense) => {
        const color = expense.category?.color || "#10B981";
        return (
          <div
            key={expense.id}
            className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:shadow-sm transition-all"
          >
            {/* Category colored bubble */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                backgroundColor: `${color}20`,
                color,
              }}
            >
              <TrendingUp className="w-4 h-4" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-card-foreground truncate">
                {expense.merchant || expense.category?.name || "Pemasukan"}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(expense.date)}
                </span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {expense.category?.name || "Lainnya"}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(expense.amount)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-muted-foreground">
            {pagination.total} pemasukan · Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
