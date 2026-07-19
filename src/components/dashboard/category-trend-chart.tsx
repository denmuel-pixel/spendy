"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/currency";

interface TrendData {
  month: string;
  amount: number;
  count: number;
}

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

const RANGE_OPTIONS = [
  { label: "3 Bulan", value: 3 },
  { label: "6 Bulan", value: 6 },
  { label: "12 Bulan", value: 12 },
] as const;

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">📅 {label}</p>
      <p className="text-slate-900 dark:text-white font-bold">
        Rp {Number(payload[0].value).toLocaleString("id-ID")}
      </p>
    </div>
  );
}

export default function CategoryTrendChart() {
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [range, setRange] = useState(6);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchTrend = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/category-trend?categoryId=${selectedCategory}&months=${range}`);
        const data = await res.json();
        if (data.data) {
          setTrendData(data.data);
          setCategoryInfo(data.category);
        }
      } catch (error) {
        console.error("Trend fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrend();
  }, [selectedCategory, range]);



  const color = categoryInfo?.color || "#10B981";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "")}>
            <SelectTrigger className="w-36 sm:w-44">
              <SelectValue placeholder="Pilih kategori...">
                {selectedCategory
                  ? (expenseCategories.find((c) => c.id === selectedCategory)?.name || selectedCategory)
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Range toggle */}
        {selectedCategory && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  range === opt.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

      </div>

      {!selectedCategory ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-slate-400">Pilih kategori untuk melihat tren</p>
        </div>
      ) : isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : trendData.length === 0 || trendData.every((d) => d.amount === 0) ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-sm text-slate-400">Belum ada data untuk kategori ini</p>
        </div>
      ) : (
        <div className={range === 12 ? "h-52" : "h-40"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#64748B", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748B", fontWeight: 500 }}
                tickFormatter={(val: number) =>
                  val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${(val / 1000).toFixed(0)}rb`
                }
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip content={<TrendTooltip />} />
              <Bar
                dataKey="amount"
                fill={color}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
