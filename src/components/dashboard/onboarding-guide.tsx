"use client";

import { useState } from "react";
import { Zap, Camera, BarChart3, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

const STEPS = [
  {
    icon: <Zap className="w-4 h-4 text-emerald-500" />,
    title: "Catat Cepat",
    desc: "Isi nominal, pilih kategori, lalu klik Catat. Cuma 3 langkah!",
    action: "Isi nominal → Pilih kategori → Catat",
  },
  {
    icon: <Camera className="w-4 h-4 text-indigo-500" />,
    title: "Upload Foto Struk",
    desc: "Tap ikon kamera 📷 untuk foto struk. Nominal & merchant terisi otomatis!",
    action: "📷 → OCR otomatis → Sesuaikan → Catat",
  },
  {
    icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
    title: "Lihat Laporan",
    desc: "Klik 'Lihat Laporan Keuangan' untuk lihat grafik, budget, dan insight.",
    action: "▼ Lihat Laporan → Chart & Analisa",
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-rose-500" />,
    title: "Atur Budget",
    desc: "Tap ⚙️ di Ringkasan Budget untuk ubah target bulanan.",
    action: "⚙️ → Masukkan nominal → Simpan",
  },
];

export default function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bento-card p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center text-white text-[9px] font-black">?</span>
          <span>Panduan Cara Pakai Spendy</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0">
                {step.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[11px] font-bold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                <span className="inline-block mt-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{step.action}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
