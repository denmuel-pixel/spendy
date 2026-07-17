"use client";

import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

interface SuccessData {
  amount: number;
  merchant?: string;
  categoryName?: string;
}

interface Props {
  open: boolean;
  data: SuccessData | null;
  onClose: () => void;
}

export default function SaveSuccessDialog({ open, data, onClose }: Props) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 max-w-xs w-full animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Berhasil Dicatat! ✅
          </h3>

          <div className="w-full space-y-2 mt-1">
            <div className="bento-card p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Nominal</span>
                <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(data.amount)}
                </span>
              </div>
              {data.merchant && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Merchant</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{data.merchant}</span>
                </div>
              )}
              {data.categoryName && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Kategori</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{data.categoryName}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
