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
  icon: string;
}

export default function CategoryTrendChart() {
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchTrend = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard/category-trend?categoryId=${selectedCategory}`);
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
  }, [selectedCategory]);

  // Icon mapping
  const getIcon = (icon: string) => {
    const map: Record<string, string> = {
      utensils: "🍔", car: "🚗", "shopping-bag": "🛍️", film: "🎬",
      "heart-pulse": "❤️", zap: "⚡", "book-open": "📚", dumbbell: "💪",
      scissors: "✂️", "trending-up": "📈", coins: "💰", landmark: "🏦",
      coffee: "☕", grid: "📦",
    };
    return map[icon] || "📦";
  };

  const color = categoryInfo?.color || "#10B981";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Pilih kategori...">
                {selectedCategory
                  ? (expenseCategories.find((c) => c.id === selectedCategory)?.name || selectedCategory)
                  : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
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
        {categoryInfo && trendData.length > 0 && (
          <span className="text-[10px] text-slate-400 font-medium">
            6 bulan terakhir
          </span>
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
        <div className="h-40">
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
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  backgroundColor: "hsl(var(--card))",
                }}
                formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pengeluaran"]}
                labelFormatter={(label) => `📅 ${label}`}
              />
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
