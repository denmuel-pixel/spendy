"use client";

import { formatCurrency } from "@/lib/currency";

interface PieData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface Props {
  data: PieData[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "Makanan & Minuman": "🍔",
  "Transportasi": "🚗",
  "Belanja": "🛍️",
  "Hiburan": "🎬",
  "Kesehatan": "❤️",
  "Tagihan & Utilitas": "⚡",
  "Pendidikan": "📚",
  "Olahraga": "💪",
};

export default function SpendingPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-slate-400">Belum ada data pengeluaran</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top5 = sorted.slice(0, 5);
  const others = sorted.slice(5);
  const othersTotal = others.reduce((sum, d) => sum + d.value, 0);
  const othersPct = total > 0 ? Math.round((othersTotal / total) * 100) : 0;

  const displayData = othersTotal > 0
    ? [...top5, { name: "Lainnya", value: othersTotal, color: "#94A3B8", percentage: othersPct }]
    : top5;

  const size = 160;
  const center = size / 2;
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm">
          {displayData.map((item) => {
            const segLen = (item.percentage / 100) * circumference;
            const dash = `${segLen} ${circumference - segLen}`;
            const curOff = offset;
            offset += segLen;
            return (
              <circle
                key={item.name}
                cx={center} cy={center} r={radius}
                fill="none" stroke={item.color} strokeWidth={strokeWidth}
                strokeDasharray={dash} strokeDashoffset={-curOff}
                strokeLinecap="butt"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
          <span className="text-[15px] font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight">{formatCurrency(total)}</span>
          <span className="text-[10px] text-slate-400 font-medium">{data.length} kategori</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 min-w-0 w-full">
        {displayData.map((item) => {
          const icon = CATEGORY_ICONS[item.name] || "📦";
          return (
            <div key={item.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-base">{icon}</span>
                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] font-bold font-mono text-slate-600 dark:text-slate-400">{formatCurrency(item.value)}</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${item.color}18`, color: item.color }}>
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
