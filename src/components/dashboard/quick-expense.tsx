"use client";

import { useState } from "react";
import { Plus, Loader2, Zap, Camera, Scan, ImageIcon } from "lucide-react";
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
import { useOcr } from "@/hooks/useOcr";
import { Toaster, toast } from "sonner";

interface Props {
  onSaved: () => void;
}

export default function QuickExpense({ onSaved }: Props) {
  const { categories } = useCategories();
  const { createExpense } = useExpenses();
  const { scanReceipt, progress, isScanning } = useOcr();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setAmount(""); return; }
    setAmount(parseInt(raw).toLocaleString("id-ID"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));

    try {
      const ocrResult = await scanReceipt(file);

      let filledCount = 0;
      if (ocrResult.totalAmount) {
        setAmount(String(Math.round(ocrResult.totalAmount)));
        filledCount++;
      }
      if (ocrResult.merchant) {
        setMerchant(ocrResult.merchant);
        filledCount++;
      }

      // Upload image to Supabase
      const formData = new FormData();
      formData.append("receipt", file);
      fetch("/api/ocr", { method: "POST", body: formData })
        .then((r) => r.json())
        .then((d) => { if (d.receiptImageUrl) setReceiptImageUrl(d.receiptImageUrl); })
        .catch(() => {});

      if (filledCount > 0) {
        toast.success(`OCR berhasil! ${filledCount} field terisi.`);
      } else {
        toast.info("OCR selesai, isi manual ya.");
      }
    } catch {
      toast.error("OCR gagal, isi manual");
    }
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
        merchant: merchant || undefined,
        date: new Date().toISOString().split("T")[0],
        receiptImageUrl: receiptImageUrl || undefined,
      });
      toast.success("Pengeluaran dicatat! ✅");
      setAmount("");
      setCategoryId("");
      setMerchant("");
      setReceiptImageUrl(null);
      setPreviewUrl(null);
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

        {/* Row 1: Big Photo + Fields */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Photo upload — extra large with animation */}
          <label className="cursor-pointer shrink-0 flex flex-col items-center gap-1.5">
            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${
              previewUrl
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-slate-200 dark:border-slate-700 hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/50 animate-pulse-glow"
            }`}>
              {isScanning ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              ) : previewUrl ? (
                <img src={previewUrl} alt="" className="w-full h-full object-cover rounded-[15px]" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-emerald-400 mb-0.5" />
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Struk</span>
                </>
              )}
            </div>
            {!previewUrl && !isScanning && (
              <span className="text-[9px] text-slate-400 font-medium text-center leading-tight">Tap to<br/>Upload</span>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} disabled={isScanning} />
          </label>

          {/* Fields column: Nominal + Merchant + Kategori + Submit */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
            {/* Amount */}
            <div className="relative sm:col-span-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
              <Input
                value={amount}
                onChange={handleAmountChange}
                placeholder="Nominal"
                className="pl-9 h-11 text-base font-bold font-mono rounded-xl"
              />
            </div>

            {/* Merchant */}
            <div className="sm:col-span-1">
              <Input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Merchant"
                className="h-11 text-sm rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-1">
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                <SelectTrigger className="h-11 rounded-xl text-xs">
                  <SelectValue placeholder="Kategori">
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
            <div className="sm:col-span-1">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !amount || !categoryId}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Catat
              </Button>
            </div>
          </div>
        </div>

        {/* Scan progress */}
        {isScanning && progress && (
          <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400">
            <Scan className="w-3 h-3 animate-pulse" />
            Memindai... {Math.round((progress.progress || 0) * 100)}%
          </div>
        )}
      </div>
    </>
  );
}
