"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  Receipt,
  Scan,
  X,
  ImageIcon,
  ArrowUp,
} from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { useOcr } from "@/hooks/useOcr";
import { Toaster, toast } from "sonner";

export default function ExpenseForm() {
  const router = useRouter();
  const { categories } = useCategories();
  const { createExpense } = useExpenses();
  const [open, setOpen] = useState(false);
  const { scanReceipt, progress, isScanning } = useOcr();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetForm = () => {
    setAmount(""); setCategoryId(""); setMerchant(""); setNotes("");
    setDate(new Date().toISOString().split("T")[0]); setPaymentMethod("");
    setReceiptImageUrl(null); setReceiptFile(null); setOcrResult(null); setPreviewUrl(null);
  };

  // Auto-format amount as IDR while typing
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setAmount(""); return; }
    setAmount(parseInt(raw).toLocaleString("id-ID"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Run OCR client-side with progress
      const ocrResultData = await scanReceipt(file);
      setOcrResult(ocrResultData);

      // Auto-fill form from OCR immediately
      let filledCount = 0;
      if (ocrResultData.totalAmount) {
        setAmount(String(Math.round(ocrResultData.totalAmount)));
        filledCount++;
      }
      if (ocrResultData.merchant) {
        setMerchant(ocrResultData.merchant);
        filledCount++;
      }
      if (ocrResultData.date) {
        try {
          const parsed = new Date(ocrResultData.date);
          if (!isNaN(parsed.getTime())) {
            setDate(parsed.toISOString().split("T")[0]);
            filledCount++;
          }
        } catch {}
      }

      // Upload image to Supabase (parallel, don't block form fill)
      const formData = new FormData();
      formData.append("receipt", file);

      fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })
        .then((r) => r.json())
        .then((uploadData) => {
          if (uploadData.receiptImageUrl) {
            setReceiptImageUrl(uploadData.receiptImageUrl);
          }
        })
        .catch(() => {});

      if (filledCount > 0) {
        toast.success(`OCR berhasil! ${filledCount} field terisi.`);
      } else {
        toast.info("OCR selesai, tapi data tidak terbaca. Isi manual ya.");
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast.error("OCR gagal, silakan isi manual");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId || !date) {
      toast.error("Lengkapi form: nominal, kategori, dan tanggal");
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpense({
        amount: parseFloat(amount),
        categoryId,
        merchant: merchant || undefined,
        notes: notes || undefined,
        date,
        paymentMethod: paymentMethod || undefined,
        receiptImageUrl: receiptImageUrl || undefined,
        ocrRawText: ocrResult?.text,
      });

      toast.success("Pengeluaran berhasil dicatat! 🎉");
      resetForm();
      setOpen(false);
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <>
      <Toaster position="top-center" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95">
              <Receipt className="w-4 h-4" />
            </Button>
          }
        />
        <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-2xl overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 sm:px-8">
          <SheetHeader className="mb-4 pt-1">
            <SheetTitle className="text-lg font-extrabold text-slate-900 dark:text-white">📸 Catat Pengeluaran</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Upload foto struk atau isi manual di bawah
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="pb-6 space-y-4 max-w-2xl mx-auto">
            {/* TWO-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* LEFT: Photo Upload */}
              <div className="md:col-span-5">
                <label className="cursor-pointer block">
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 text-center bg-white dark:bg-slate-900 relative flex flex-col justify-center items-center h-40 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs text-slate-500">
                          {progress?.status === "loading language traineddata" ? "Download data OCR..." :
                           progress?.status === "recognizing text" ? "Memindai teks..." :
                           "Memproses..."}
                        </span>
                        {progress && (
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.round((progress.progress || 0) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    ) : previewUrl ? (
                      <div className="relative w-full">
                        <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-2xl object-contain" />
                        <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">✓</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 text-slate-400 animate-float-slow" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Upload Foto Struk</span>
                        <p className="text-[9px] text-slate-400 max-w-[140px]">Seret atau tap untuk memindai otomatis</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} disabled={isScanning} />
                </label>
                {ocrResult && (
                  <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Scan className="w-3 h-3" />
                    OCR selesai (confidence: {Math.round(ocrResult.confidence)}%)
                  </div>
                )}
              </div>

              {/* RIGHT: Manual Form */}
              <div className="md:col-span-7 space-y-3">
                {/* Amount with IDR format */}
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nominal (Rp)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">Rp</span>
                    <Input
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0"
                      required
                      className="pl-10 text-base font-bold font-mono h-10 rounded-xl"
                    />
                  </div>
                  {amount && (
                    <p className="text-[9px] text-slate-400 mt-0.5 ml-1">
                      {parseInt(amount.replace(/\D/g, "") || "0").toLocaleString("id-ID")} rupiah
                    </p>
                  )}
                </div>

                {/* Merchant */}
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant / Toko</Label>
                  <Input
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="Starbucks, Indomaret, Grab..."
                    className="mt-1 h-10 rounded-xl"
                  />
                </div>

                {/* Category + Date row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</Label>
                    <Select value={categoryId} onValueChange={(val) => val && setCategoryId(val)} required>
                      <SelectTrigger className="mt-1 h-9 rounded-xl text-xs">
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
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 h-9 rounded-xl text-xs" />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pembayaran</Label>
                  <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                    <SelectTrigger className="mt-1 h-9 rounded-xl text-xs">
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
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-xl text-xs font-bold" onClick={() => { resetForm(); setOpen(false); }}>
                Batal
              </Button>
              <Button type="submit" className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Menyimpan...</> : "Simpan Pengeluaran"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
