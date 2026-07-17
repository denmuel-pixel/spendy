"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Search,
  Filter,
} from "lucide-react";
import ReceiptVault from "./receipt-vault";
import EditExpenseDialog from "./edit-expense-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/currency";
import { Toaster, toast } from "sonner";

export default function ExpenseList() {
  const router = useRouter();
  const { categories } = useCategories();
  const { expenses, pagination, isLoading, fetchExpenses, deleteExpense } = useExpenses();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const filters: any = { page, limit: 5 };
    if (categoryFilter && categoryFilter !== "all") {
      filters.categoryId = categoryFilter;
    }
    if (search) {
      filters.search = search;
    }
    fetchExpenses(filters);
  }, [page, categoryFilter, search, fetchExpenses]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return;
    try {
      await deleteExpense(id);
      toast.success("Pengeluaran dihapus");
      fetchExpenses({ page, limit: 5 });
      router.refresh();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <Toaster position="top-center" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari merchant atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Semua">
              {categoryFilter === "all"
                ? "Semua"
                : categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories
              .filter((c) => c.type === "expense")
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada pengeluaran</p>
          <p className="text-xs mt-1">
            Klik tombol &quot;Catat Pengeluaran&quot; untuk memulai
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {expenses.map((expense) => {
            const catIcon = 
              expense.category.icon === "utensils" ? "🍔" :
              expense.category.icon === "car" ? "🚗" :
              expense.category.icon === "shopping-bag" ? "🛍️" :
              expense.category.icon === "film" ? "🎬" :
              expense.category.icon === "heart-pulse" ? "❤️" :
              expense.category.icon === "zap" ? "⚡" :
              expense.category.icon === "book-open" ? "📚" :
              expense.category.icon === "dumbbell" ? "💪" :
              expense.category.icon === "scissors" ? "✂️" :
              expense.category.icon === "trending-up" ? "📈" :
              "📦";

            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:shadow-sm transition-all"
              >
                {/* Category colored bubble */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{
                    backgroundColor: `${expense.category.color}20`,
                    color: expense.category.color,
                  }}
                >
                  {catIcon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-card-foreground truncate">
                    {expense.merchant || expense.category.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(expense.date)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {expense.category.name}
                    </span>
                    {expense.receiptImageUrl && (
                      <ReceiptVault
                        imageUrl={expense.receiptImageUrl}
                        merchant={expense.merchant}
                        amount={expense.amount}
                      />
                    )}
                  </div>
                </div>

                {/* Amount + Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-xs font-bold font-mono">
                    {formatCurrency(expense.amount)}
                  </span>
                  <EditExpenseDialog expense={expense} onUpdated={() => fetchExpenses({ page, limit: 5 })} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground/40 hover:text-destructive"
                    onClick={() => handleDelete(expense.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination — always show when there are results */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            {pagination.total} transaksi · Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Receipt(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}
