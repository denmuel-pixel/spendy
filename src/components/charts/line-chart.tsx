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
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(val: number) =>
            val >= 1000000
              ? `${(val / 1000000).toFixed(1)}jt`
              : val >= 1000
              ? `${(val / 1000).toFixed(0)}rb`
              : String(val)
          }
          tickLine={false}
          axisLine={false}
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
