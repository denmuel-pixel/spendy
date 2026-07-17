"use client";

import { useState, useEffect } from "react";
import { Pencil, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/currency";
import { Toaster, toast } from "sonner";

interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  merchant: string | null;
  notes: string | null;
  date: string;
  paymentMethod: string | null;
  receiptImageUrl: string | null;
  category: { id: string; name: string; icon: string; color: string };
}

interface Props {
  expense: Expense;
  onUpdated: () => void;
}

export default function EditExpenseDialog({ expense, onUpdated }: Props) {
  const { categories } = useCategories();
  const { updateExpense, deleteExpense } = useExpenses();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (open && expense) {
      setAmount(String(Math.round(expense.amount)));
      setCategoryId(expense.categoryId);
      setMerchant(expense.merchant || "");
      setNotes(expense.notes || "");
      setDate(expense.date?.split("T")[0] || "");
      setPaymentMethod(expense.paymentMethod || "");
    }
  }, [open, expense]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      toast.error("Lengkapi form: nominal, kategori, dan tanggal");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateExpense(expense.id, {
        amount: parseFloat(amount),
        categoryId,
        merchant: merchant || undefined,
        notes: notes || undefined,
        date,
        paymentMethod: paymentMethod || undefined,
      });
      toast.success("Pengeluaran diperbarui! ✏️");
      setOpen(false);
      onUpdated();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus pengeluaran ini?")) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast.success("Pengeluaran dihapus 🗑️");
      setOpen(false);
      onUpdated();
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <>
      <Toaster position="top-center" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground/40 hover:text-emerald-500">
              <Pencil className="w-3 h-3" />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="w-4 h-4 text-emerald-500" />
              Edit Pengeluaran
            </DialogTitle>
            <DialogDescription className="text-xs">
              {expense.merchant || expense.category.name} · {formatCurrency(expense.amount)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Amount */}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nominal (Rp)</Label>
              <div className="relative mt-0.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">Rp</span>
                <Input
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  required
                  className="pl-10 text-base font-bold font-mono h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Merchant */}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant / Toko</Label>
              <Input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Starbucks, Indomaret..."
                className="mt-0.5 h-10 rounded-xl text-sm"
              />
            </div>

            {/* Category + Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</Label>
                <Select value={categoryId} onValueChange={(val) => val && setCategoryId(val)} required>
                  <SelectTrigger className="mt-0.5 h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-0.5 h-9 rounded-xl text-xs" />
              </div>
            </div>

            {/* Payment */}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                <SelectTrigger className="mt-0.5 h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Metode bayar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">💵 Tunai</SelectItem>
                  <SelectItem value="QRIS">📱 QRIS</SelectItem>
                  <SelectItem value="Kartu">💳 Kartu</SelectItem>
                  <SelectItem value="Transfer">🏦 Transfer</SelectItem>
                  <SelectItem value="E-Wallet">📲 E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsional..."
                className="flex min-h-[50px] w-full rounded-xl border border-input bg-transparent px-3 py-1.5 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-0.5"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl text-[10px] font-bold text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Hapus
              </Button>
              <Button
                type="submit"
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Menyimpan...</> : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
