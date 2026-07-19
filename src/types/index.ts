// Shared TypeScript types for Spendy

export type CurrencyCode = "IDR" | "USD" | "SGD" | "MYR";

export type PaymentMethod = "Cash" | "QRIS" | "Kartu" | "Transfer" | "E-Wallet";

export type CategoryType = "expense" | "income";

export type Frequency = "monthly" | "yearly" | "weekly";

export type Priority = "low" | "medium" | "high";

export interface ExpenseInput {
  amount: number;
  currency?: CurrencyCode;
  categoryId: string;
  merchant?: string;
  notes?: string;
  date: Date;
  paymentMethod?: PaymentMethod;
  receiptImage?: File;
}

export interface OcrParsedData {
  amount?: number;
  date?: string;
  merchant?: string;
  rawText: string;
}

export interface DashboardSummary {
  totalThisMonth: number;
  dailyAverage: number;
  transactionCount: number;
  topCategory: { name: string; amount: number; percentage: number } | null;
  totalBudget: number;
  budgetUsed: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}
