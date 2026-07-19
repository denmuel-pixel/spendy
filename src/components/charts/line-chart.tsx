"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineData {
  date: string;
  amount: number;
}

interface Props {
  data: LineData[];
}

function ChartTooltip({ active, payload, label }: any) {
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

export default function SpendingLineChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Belum ada data pengeluaran 30 hari terakhir</p>
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
          tickFormatter={(val: number) =>
            val >= 1000000
              ? `${(val / 1000000).toFixed(1)}jt`
              : val >= 1000
              ? `${(val / 1000).toFixed(0)}rb`
              : String(val)
          }
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#spendGradient)"
          dot={{ r: 3, fill: "#10B981", stroke: "white", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#10B981", stroke: "white", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
