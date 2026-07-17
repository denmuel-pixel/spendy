"use client";

import { useState } from "react";
import { Plus, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { Toaster, toast } from "sonner";

interface Props {
  onSaved: () => void;
}

export default function QuickExpense({ onSaved }: Props) {
  const { categories } = useCategories();
  const { createExpense } = useExpenses();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setAmount(""); return; }
    setAmount(parseInt(raw).toLocaleString("id-ID"));
  };

  const handleSubmit = async () => {
    const rawAmount = amount.replace(/\D/g, "");
    if (!rawAmount || !categoryId) {
      toast.error("Isi nominal dan kategori");
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpense({
        amount: parseFloat(rawAmount),
        categoryId,
        date: new Date().toISOString().split("T")[0],
      });
      toast.success("Pengeluaran dicatat! ✅");
      setAmount("");
      setCategoryId("");
      onSaved();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (icon: string) => {
    const map: Record<string, string> = {
      utensils: "🍔", car: "🚗", "shopping-bag": "🛍️", film: "🎬",
      "heart-pulse": "❤️", zap: "⚡", "book-open": "📚", dumbbell: "💪",
      scissors: "✂️", "trending-up": "📈", coins: "💰", landmark: "🏦",
      coffee: "☕", grid: "📦",
    };
    return map[icon] || "📦";
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="bento-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
            Catat Cepat
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Amount */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
            <Input
              value={amount}
              onChange={handleAmountChange}
              placeholder="Nominal"
              className="pl-9 h-11 text-base font-bold font-mono rounded-xl"
            />
          </div>

          {/* Category */}
          <div className="w-full sm:w-44">
            <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
              <SelectTrigger className="h-11 rounded-xl text-xs">
                <SelectValue placeholder="Pilih kategori">
                  {categoryId
                    ? expenseCategories.find((c) => c.id === categoryId)?.name || categoryId
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{getIcon(cat.icon)}</span>
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !amount || !categoryId}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Catat
          </Button>
        </div>
      </div>
    </>
  );
}
