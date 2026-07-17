"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardData {
  summary: {
    totalThisMonth: number;
    dailyAverage: number;
    transactionCount: number;
    topCategory: { name: string; amount: number; percentage: number } | null;
  };
  categories: {
    categoryId: string;
    name: string;
    color: string;
    icon: string;
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
    categoryIcon: string;
    date: string;
    notes: string | null;
  }[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const result = await res.json();
      if (result.summary) {
        setData(result);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, refetch: fetchDashboard };
}
