"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardData {
  summary: {
    totalThisMonth: number;
    dailyAverage: number;
    transactionCount: number;
    topCategory: { name: string; amount: number; percentage: number } | null;
    expenseTotal?: number;
    incomeTotal?: number;
    netTotal?: number;
  };
  categories: {
    categoryId: string;
    name: string;
    color: string;
  
    total: number;
    percentage: number;
    count: number;
  }[];
  dailySpending: { date: string; amount: number }[];
  recentTransactions: {
    id: string;
    amount: number;
    merchant: string | null;
    categoryName: string;
    categoryColor: string;
    date: string;
    notes: string | null;
  }[];
}

export function useDashboard(dateRange?: { startDate: string; endDate: string } | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable string key to detect dateRange changes reliably
  const rangeKey = dateRange ? `${dateRange.startDate}|${dateRange.endDate}` : "default";

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.set("startDate", dateRange.startDate);
      if (dateRange?.endDate) params.set("endDate", dateRange.endDate);
      const qs = params.toString();
      const res = await fetch(`/api/dashboard${qs ? `?${qs}` : ""}`);
      const result = await res.json();
      if (result.summary) {
        setData(result);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, refetch: fetchDashboard };
}
