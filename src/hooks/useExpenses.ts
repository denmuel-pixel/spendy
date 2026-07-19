"use client";

import { useState, useCallback } from "react";

interface ExpenseCategory {
  id: string;
  name: string;

  color: string;
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  categoryId: string;
  merchant: string | null;
  notes: string | null;
  date: string;
  paymentMethod: string | null;
  receiptImageUrl: string | null;
  ocrRawText: string | null;
  category: ExpenseCategory;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ExpenseFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  search?: string;
  type?: string; // "expense" | "income"
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenses = useCallback(async (filters: ExpenseFilters = {}) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.search) params.set("search", filters.search);
      if (filters.type) params.set("type", filters.type);

      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (data.expenses) {
        setExpenses(data.expenses);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExpense = async (data: {
    amount: number;
    categoryId: string;
    merchant?: string;
    notes?: string;
    date: string;
    paymentMethod?: string;
    receiptImageUrl?: string;
    ocrRawText?: string;
  }) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    return result.expense;
  };

  const updateExpense = async (id: string, data: Partial<{
    amount: number;
    categoryId: string;
    merchant: string;
    notes: string;
    date: string;
    paymentMethod: string;
    receiptImageUrl: string;
  }>) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    return result.expense;
  };

  const deleteExpense = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    return true;
  };

  return {
    expenses,
    pagination,
    isLoading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
