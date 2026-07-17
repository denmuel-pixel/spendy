"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
        <p className="text-sm">Belum ada data</p>
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10 }}
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
          formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pengeluaran"]}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
