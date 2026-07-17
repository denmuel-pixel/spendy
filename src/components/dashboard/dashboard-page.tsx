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
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 w-8 h-8 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-bold text-lg">Spendy</span>
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

      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <FadeIn delay={0.05}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Halo, {user.name || user.email.split("@")[0]} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                {dateRange
                  ? `Ringkasan ${new Date(dateRange.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })} - ${new Date(dateRange.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}`
                  : "Ringkasan keuangan bulan ini"}
              </p>
            </div>
            <ExpenseForm />
          </div>
        </FadeIn>

        {/* AI Insights */}
        <FadeIn delay={0.1}>
          <SpendingInsights
            totalThisMonth={summary?.totalThisMonth || 0}
            dailyAverage={summary?.dailyAverage || 0}
            transactionCount={summary?.transactionCount || 0}
            budgetLimit={5000000}
            topCategory={summary?.topCategory || null}
          />
        </FadeIn>

        <div className="h-4" />

        {/* Summary Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" staggerDelay={0.04}>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(summary?.totalThisMonth || 0)}</div>
                    {summary && summary.transactionCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{summary.transactionCount} transaksi</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Harian</CardTitle>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(summary?.dailyAverage || 0)}</div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transaksi</CardTitle>
                <Receipt className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="text-2xl font-bold">{summary?.transactionCount || 0}</div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Kategori Teratas</CardTitle>
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                ) : summary?.topCategory ? (
                  <>
                    <div className="text-xl font-bold truncate">{summary.topCategory.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">{summary.topCategory.percentage}% dari total</p>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold truncate">—</div>
                    <p className="text-xs text-muted-foreground mt-1">Belum ada data</p>
                  </>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Budget Gauge */}
        {summary && summary.transactionCount > 0 && (
          <FadeIn delay={0.25}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Ringkasan Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetGauge
                  totalSpent={summary.totalThisMonth}
                  budgetLimit={5000000}
                />
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Charts Section */}
        <FadeIn delay={0.3}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
                  </div>
                ) : (
                  <SpendingPieChart data={pieData} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tren Pengeluaran (30 Hari)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full h-48 bg-muted rounded animate-pulse" />
                  </div>
                ) : (
                  <SpendingLineChart data={lineData} />
                )}
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Recent Transactions */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Riwayat Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <ExpenseList />
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </main>
    </>
  );
}
