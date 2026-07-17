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
    setAmount("");
    setCategoryId("");
    setMerchant("");
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("");
    setReceiptImageUrl(null);
    setReceiptFile(null);
    setOcrResult(null);
    setPreviewUrl(null);
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
        <SheetTrigger>
          <Button className="gap-2 rounded-full shadow-lg">
            <Receipt className="w-4 h-4" />
            Catat Pengeluaran
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Catat Pengeluaran Baru</SheetTitle>
            <SheetDescription>
              Upload foto struk atau isi manual
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pb-8">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Foto Struk / Screenshot</Label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        <span className="text-xs text-muted-foreground">
                          {progress?.status === "loading tesseract core" && "Menyiapkan OCR engine..."}
                          {progress?.status === "initializing tesseract" && "Inisialisasi..."}
                          {progress?.status === "loading language traineddata" && "Download data bahasa (~10MB)..."}
                          {progress?.status === "initializing api" && "Memulai OCR..."}
                          {progress?.status === "recognizing text" && "Memindai teks..."}
                          {(progress?.status || "").includes("error") && "Memproses..."}
                          {!progress?.status && "Memproses..."}
                        </span>
                        {progress && (
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round((progress.progress || 0) * 100)}%` }}
                            />
                          </div>
                        )}
                        {progress?.status === "loading language traineddata" && (
                          <span className="text-[10px] text-muted-foreground">
                            Hanya sekali, data akan di-cache
                          </span>
                        )}
                      </div>
                    ) : previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="max-h-24 mx-auto rounded-lg object-contain"
                        />
                        <span className="text-xs text-emerald-600 mt-1 block">
                          ✓ Foto terupload
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Tap untuk upload foto
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          Otomatis baca nominal & merchant
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isScanning}
                  />
                </label>
              </div>
              {ocrResult && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Scan className="w-3 h-3 inline mr-1" />
                  OCR selesai (confidence: {Math.round(ocrResult.confidence)}%)
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Nominal (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="text-lg font-mono"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryId} onValueChange={(val) => val && setCategoryId(val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Merchant */}
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant / Toko</Label>
              <Input
                id="merchant"
                placeholder="e.g. Starbucks, Indomaret, Grab"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
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
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <textarea
                id="notes"
                className="flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Tambahkan catatan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { resetForm(); setOpen(false); }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
