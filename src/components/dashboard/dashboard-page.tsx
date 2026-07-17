"use client";

import { useState, useCallback } from "react";
import {
  LogOut,
  Moon,
  Sun,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import CategoryTrendChart from "@/components/dashboard/category-trend-chart";
import DateRangeFilter from "@/components/dashboard/date-range-filter";
import FadeIn from "@/components/ui/fade-in";
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
        <header className="sticky top-0 z-50 glass-panel">
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

      <main className="flex-1 max-w-[1250px] mx-auto px-6 py-6 w-full space-y-4" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 80%, rgba(99,102,241,0.04) 0%, transparent 60%)"
      }}>
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
              <ExpenseForm />
            </div>
          </div>
        </FadeIn>

        {/* Filter Bar — Date + Category below header */}
        <FadeIn delay={0.08}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DateRangeFilter onFilter={handleDateFilter} isLoading={isLoading} />
              <CategoryManager />
            </div>
            {summary && summary.transactionCount > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                {summary.transactionCount} transaksi · {formatCurrency(summary.totalThisMonth)}
              </span>
            )}
          </div>
        </FadeIn>

        {/* Budget + Insights — side by side above summary */}
        {summary && summary.transactionCount > 0 && (
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bento-card p-5">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-3">
                  Ringkasan Budget
                </h3>
                <BudgetGauge
                  totalSpent={summary.totalThisMonth}
                  budgetLimit={5000000}
                />
              </div>
              <div className="bento-card p-5">
                <SpendingInsights
                  totalThisMonth={summary.totalThisMonth || 0}
                  dailyAverage={summary.dailyAverage || 0}
                  transactionCount={summary.transactionCount || 0}
                  budgetLimit={5000000}
                  topCategory={summary.topCategory || null}
                />
              </div>
            </div>
          </FadeIn>
        )}



        {/* Charts Section — two equal columns */}
        <FadeIn delay={0.3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Pie Chart only */}
            <div className="bento-card p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                Pengeluaran per Kategori
              </h3>
              <div className="h-56">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </div>
                ) : (
                  <SpendingPieChart data={pieData} />
                )}
              </div>
            </div>

            {/* Right: Area Chart */}
            <div className="bento-card p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                Tren Pengeluaran (30 Hari)
              </h3>
              <div className="h-56">
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

        {/* Category Trend — track specific category over months */}
        <FadeIn delay={0.35}>
          <div className="bento-card p-5">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-3">
              Tren per Kategori
            </h3>
            <CategoryTrendChart />
          </div>
        </FadeIn>

        {/* Recent Transactions */}
        <FadeIn delay={0.3}>
          <div className="bento-card p-6 space-y-4">
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
