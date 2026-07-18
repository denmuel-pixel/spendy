"use client";

import { useState } from "react";
import { X, Zap, Camera, Receipt, BarChart3, Lightbulb } from "lucide-react";

const STORAGE_KEY = "spendy-onboarding-dismissed";

const STEPS = [
  {
    icon: <Zap className="w-5 h-5 text-emerald-500" />,
    title: "Catat Cepat",
    desc: "Isi nominal, pilih kategori, lalu klik Catat. Cuma 3 langkah!",
    action: "Isi nominal → Pilih kategori → Catat",
  },
  {
    icon: <Camera className="w-5 h-5 text-indigo-500" />,
    title: "Upload Foto Struk",
    desc: "Tap ikon kamera 📷 untuk foto struk. Nominal & merchant terisi otomatis!",
    action: "📷 → OCR otomatis → Sesuaikan → Catat",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-amber-500" />,
    title: "Lihat Laporan",
    desc: "Klik 'Lihat Laporan Keuangan' untuk lihat grafik, budget, dan insight.",
    action: "▼ Lihat Laporan → Chart & Analisa",
  },
  {
    icon: <Lightbulb className="w-5 h-5 text-rose-500" />,
    title: "Atur Budget",
    desc: "Tap ⚙️ di Ringkasan Budget untuk ubah target bulanan.",
    action: "⚙️ → Masukkan nominal → Simpan",
  },
];

export default function OnboardingGuide() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <div className="bento-card p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-xl" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-tr from-amber-500/10 to-rose-500/10 rounded-full blur-xl" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            🎉 Selamat Datang di Spendy!
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Ikuti panduan singkat ini untuk mulai mencatat pengeluaran
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {step.desc}
              </p>
              <span className="inline-block mt-1 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                {step.action}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-3 w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-center"
      >
        ✕ Tutup panduan
      </button>
    </div>
  );
}
