"use client";

import { useState, useCallback } from "react";
import {
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Receipt,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  KeyRound,
  Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/currency";
import ExpenseForm from "@/components/expenses/expense-form";
import ExpenseList from "@/components/expenses/expense-list";
import SetPinDialog from "@/components/dashboard/set-pin-dialog";
import CategoryManager from "@/components/dashboard/category-manager";
import SpendingInsights from "@/components/dashboard/spending-insights";
import BudgetGauge from "@/components/dashboard/budget-gauge";
import SpendingPieChart from "@/components/charts/pie-chart";
import SpendingLineChart from "@/components/charts/line-chart";
import DateRangeFilter from "@/components/dashboard/date-range-filter";
import FadeIn, { StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { Toaster, toast } from "sonner";

interface DashboardPageProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const { logout } = useAuth();
  const { data, isLoading, refetch } = useDashboard();
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark", !isDark);
    localStorage.setItem("spendy-theme", newTheme);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout");
    window.location.href = "/login";
  };

  const handleDateFilter = useCallback((range: { startDate: string; endDate: string } | null) => {
    setDateRange(range);
    // Refetch with new date params — will be handled by the hook
    refetch();
  }, [refetch]);

  const summary = data?.summary;
  const pieData = (data?.categories || []).map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color,
    percentage: c.percentage,
  }));
  const lineData = data?.dailySpending || [];

  return (
    <>
      <Toaster position="top-center" />
      {/* Navbar */}
      <FadeIn direction="none">
        <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900">
          <div className="max-w-[1250px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                S
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Spendy</span>
                <span className="badge-emerald">Pocket v1.0</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <DateRangeFilter onFilter={handleDateFilter} isLoading={isLoading} />
              <CategoryManager />
              <SetPinDialog />
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { refetch(); toast.success("Dashboard diperbarui"); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleTheme}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>
      </FadeIn>

      <main className="flex-1 max-w-[1250px] mx-auto px-6 py-8 w-full space-y-6 bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <FadeIn delay={0.05}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Halo, {user.name || user.email.split("@")[0]} 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {dateRange
                  ? `Ringkasan ${new Date(dateRange.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} - ${new Date(dateRange.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`
                  : "Ringkasan keuangan bulan ini"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs rounded-2xl"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/seed-data", { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(data.message);
                      refetch();
                    } else {
                      toast.error(data.error || "Gagal");
                    }
                  } catch {
                    toast.error("Gagal seed data");
                  }
                }}
              >
                <Beaker className="w-3.5 h-3.5" />
                Data Contoh
              </Button>
              <ExpenseForm />
            </div>
          </div>
        </FadeIn>

        {/* AI Insights */}
        {summary && summary.transactionCount > 0 && (
          <FadeIn delay={0.1}>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-5 space-y-3 shadow-xs">
              <SpendingInsights
                totalThisMonth={summary.totalThisMonth || 0}
                dailyAverage={summary.dailyAverage || 0}
                transactionCount={summary.transactionCount || 0}
                budgetLimit={5000000}
                topCategory={summary.topCategory || null}
              />
            </div>
          </FadeIn>
        )}

        {/* Summary Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.04}>
          <StaggerItem>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</span>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(summary?.totalThisMonth || 0)}</div>
                  {summary && summary.transactionCount > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">{summary.transactionCount} transaksi</p>
                  )}
                </>
              )}
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Rata-rata</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(summary?.dailyAverage || 0)}</div>
              )}
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Transaksi</span>
                <Receipt className="w-4 h-4 text-amber-500" />
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary?.transactionCount || 0}</div>
              )}
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Teratas</span>
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : summary?.topCategory ? (
                <>
                  <div className="text-xl font-bold text-slate-900 dark:text-white truncate">{summary.topCategory.name}</div>
                  <p className="text-[10px] text-slate-400 mt-1">{summary.topCategory.percentage}% dari total</p>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-slate-300 dark:text-slate-600">—</div>
                  <p className="text-[10px] text-slate-400 mt-1">Belum ada data</p>
                </>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Budget Gauge */}
        {summary && summary.transactionCount > 0 && (
          <FadeIn delay={0.25}>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                Ringkasan Budget
              </h3>
              <BudgetGauge
                totalSpent={summary.totalThisMonth}
                budgetLimit={5000000}
              />
            </div>
          </FadeIn>
        )}

        {/* Charts Section */}
        <FadeIn delay={0.3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                Pengeluaran per Kategori
              </h3>
              <div className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </div>
                ) : (
                  <SpendingPieChart data={pieData} />
                )}
              </div>
            </div>
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                Tren Pengeluaran (30 Hari)
              </h3>
              <div className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                ) : (
                  <SpendingLineChart data={lineData} />
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Recent Transactions */}
        <FadeIn delay={0.3}>
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
              Riwayat Pengeluaran
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <ExpenseList />
            )}
          </div>
        </FadeIn>
      </main>
    </>
  );
}
