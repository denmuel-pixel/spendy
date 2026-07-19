"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBankStatement } from "@/hooks/useBankStatement";
import { Toaster, toast } from "sonner";

const BANKS = [
  { id: "bca", label: "BCA" },
  { id: "danamon", label: "Danamon" },
  { id: "mega", label: "Mega" },
] as const;

interface Props {
  onSaved: () => void;
}

export default function BankStatementImport({ onSaved }: Props) {
  const {
    isParsing,
    isImporting,
    parseResult,
    importResult,
    error,
    parsePdf,
    importTransactions,
    reset,
  } = useBankStatement();

  const [open, setOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("bca");
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"select" | "parsing" | "importing" | "done">("select");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
    }
  };

  const handleParse = async () => {
    if (!file) {
      toast.error("Pilih file PDF terlebih dahulu");
      return;
    }

    setStep("parsing");
    const result = await parsePdf(file, selectedBank);

    if (!result || !result.success) {
      setStep("select");
      toast.error(error || "Gagal parsing");
      return;
    }

    toast.success(`${result.total} transaksi ditemukan dari ${selectedBank.toUpperCase()}`);

    // Auto-import immediately
    setStep("importing");
    const importRes = await importTransactions(result.transactions);

    if (!importRes || !importRes.success) {
      setStep("done");
      toast.error(error || "Gagal import");
      return;
    }

    setStep("done");
    toast.success(`${importRes.imported} transaksi berhasil diimport!`);
    if (importRes.failed > 0) {
      toast.error(`${importRes.failed} transaksi gagal`);
    }
    onSaved();
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after dialog closes with delay
    setTimeout(() => {
      reset();
      setFile(null);
      setStep("select");
      setSelectedBank("bca");
    }, 300);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) handleClose();
    else setOpen(true);
  };

  return (
    <>
      <Toaster position="top-center" />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Statement</span>
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-500" />
              Import Bank Statement
            </DialogTitle>
            <DialogDescription>
              Upload PDF mutasi bank untuk auto-import transaksi
            </DialogDescription>
          </DialogHeader>

          {step === "select" && (
            <div className="space-y-4">
              {/* Bank selector */}
              <div>
                <span className="text-xs text-muted-foreground block mb-2 font-medium">
                  Pilih Bank
                </span>
                <div className="flex gap-2">
                  {BANKS.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedBank === bank.id
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {bank.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <span className="text-xs text-muted-foreground block mb-2 font-medium">
                  Upload File PDF
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 ${
                    file
                      ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-border"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Klik untuk pilih file PDF
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        Format: PDF (max 10MB)
                      </p>
                    </div>
                  )}
                </button>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleParse}
                disabled={!file || isParsing}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import & Parse Otomatis
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "parsing" && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" />
              <p className="text-sm font-bold">Membaca PDF...</p>
              <p className="text-xs text-muted-foreground">
                Mengekstrak teks dari file {file?.name}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" />
              <p className="text-sm font-bold">Menyimpan transaksi...</p>
              <p className="text-xs text-muted-foreground">
                {parseResult?.total || 0} transaksi sedang diimport
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 max-w-xs mx-auto overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center space-y-3">
              {importResult?.imported && importResult.imported > 0 ? (
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              ) : (
                <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
              )}
              <p className="text-sm font-bold">
                {importResult?.imported
                  ? `${importResult.imported} transaksi berhasil diimport!`
                  : "Import gagal"}
              </p>
              <p className="text-xs text-muted-foreground">
                {importResult?.failed
                  ? `${importResult.failed} transaksi gagal`
                  : `Dari ${selectedBank.toUpperCase()} — ${file?.name}`}
              </p>
              {importResult?.errors && importResult.errors.length > 0 && (
                <div className="text-left max-h-24 overflow-y-auto space-y-1 p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-[10px] text-rose-600 dark:text-rose-400">
                      Transaksi #{e.index + 1}: {e.error}
                    </p>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleClose}
              >
                Selesai
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
