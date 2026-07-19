"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/currency";
import ExpenseList from "@/components/expenses/expense-list";
import SetPinDialog from "@/components/dashboard/set-pin-dialog";
import IncomeList from "@/components/dashboard/income-list";
import AiQuery from "@/components/dashboard/ai-query";
import BankStatementImport from "@/components/dashboard/bank-statement-import";
import CategoryManager from "@/components/dashboard/category-manager";
import SpendingInsights from "@/components/dashboard/spending-insights";
import BudgetGauge from "@/components/dashboard/budget-gauge";
import SpendingPieChart from "@/components/charts/pie-chart";
import SpendingLineChart from "@/components/charts/line-chart";
import CategoryTrendChart from "@/components/dashboard/category-trend-chart";
import QuickExpense from "@/components/dashboard/quick-expense";
import OnboardingGuide from "@/components/dashboard/onboarding-guide";
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
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const { data, isLoading, refetch } = useDashboard(dateRange);
  const [budgetLimit, setBudgetLimit] = useState(5000000);
  const [showReport, setShowReport] = useState(false);

  // Fetch budget from API on mount
  useEffect(() => {
    fetch("/api/user/budget")
      .then((r) => r.json())
      .then((d) => { if (d.budget) setBudgetLimit(d.budget); })
      .catch(() => {}); // fallback default
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout");
    window.location.href = "/login";
  };

  const handleDateFilter = useCallback((range: { startDate: string; endDate: string } | null) => {
    setDateRange(range);
  }, []);

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
              <BankStatementImport onSaved={refetch} />
              <SetPinDialog />
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>
      </FadeIn>

      <main className="flex-1 max-w-[1250px] mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full space-y-4 sm:space-y-5" style={{
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
          </div>
        </FadeIn>

        {/* Onboarding accordion guide */}
        <FadeIn delay={0.04}>
          <OnboardingGuide />
        </FadeIn>

        {/* Quick Expense — main feature */}
        <FadeIn delay={0.06}>
          <QuickExpense onSaved={refetch} />
        </FadeIn>

        {/* Toggle Report */}
        <FadeIn delay={0.08}>
          <button
            type="button"
            onClick={() => setShowReport(!showReport)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            {showReport ? "▲" : "▼"} {showReport ? "Sembunyikan" : "Lihat"} Laporan Keuangan
          </button>
        </FadeIn>

        {/* Report Section — collapsible */}
        {showReport && (
          <>
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

        {/* Budget + Insights */}
        {summary && summary.transactionCount > 0 && (
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bento-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Ringkasan Budget</h3>
                  <span className="text-[9px] text-muted-foreground/60 font-medium">
                    {dateRange
                      ? `${new Date(dateRange.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${new Date(dateRange.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                      : new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                  </span>
                </div>
                <BudgetGauge totalSpent={summary.totalThisMonth} budgetLimit={budgetLimit} onBudgetChange={setBudgetLimit} />
              </div>
              <div className="bento-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Pemasukan vs Pengeluaran</h3>
                </div>
                <div className="space-y-3">
                  {/* Pemasukan */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Pemasukan</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {summary.incomeTotal ? formatCurrency(summary.incomeTotal) : "Rp 0"}
                    </span>
                  </div>
                  {/* Pengeluaran */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Pengeluaran</span>
                    </div>
                    <span className="text-xs font-bold text-rose-500">
                      {summary.expenseTotal ? formatCurrency(summary.expenseTotal) : "Rp 0"}
                    </span>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-slate-100 dark:bg-slate-800" />
                  {/* Selisih */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Selisih</span>
                    <span className={`text-xs font-bold ${(summary.netTotal ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                      {summary.netTotal !== undefined ? formatCurrency(Math.abs(summary.netTotal)) : "Rp 0"}
                      {(summary.netTotal ?? 0) >= 0 ? " 👍" : " ⚠️"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bento-card p-5">
                <SpendingInsights totalThisMonth={summary.totalThisMonth || 0} dailyAverage={summary.dailyAverage || 0} transactionCount={summary.transactionCount || 0} budgetLimit={budgetLimit} topCategory={summary.topCategory || null} />
              </div>
            </div>
          </FadeIn>
        )}

        {/* Charts */}
        <FadeIn delay={0.3}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
              {dateRange
                ? `${new Date(dateRange.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${new Date(dateRange.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                : "Bulan Ini"}
            </span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            {summary && summary.transactionCount > 0 && (
              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                {summary.transactionCount} transaksi
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            <div className="bento-card p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                {dateRange ? "Pengeluaran per Periode" : "Pengeluaran per Kategori"}
              </h3>
              <div className="min-h-[300px] lg:min-h-0 lg:h-56">
                {isLoading ? (
                  <div className="h-[300px] lg:h-56 flex items-center justify-center"><div className="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" /></div>
                ) : (
                  <SpendingPieChart data={pieData} />
                )}
              </div>
            </div>
            <div className="bento-card p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                {dateRange ? "Tren Pengeluaran" : "Tren Pengeluaran (30 Hari)"}
              </h3>
              <div className="h-[200px] lg:h-56">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center"><div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></div>
                ) : (
                  <SpendingLineChart data={lineData} />
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Category Trend */}
        <FadeIn delay={0.35}>
          <div className="bento-card p-5">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest mb-3">Tren per Kategori</h3>
            <CategoryTrendChart />
          </div>
        </FadeIn>
          </>
        )}

        {/* Recent Transactions */}
        {showReport && (
        <FadeIn delay={0.3}>
          <div className="bento-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Riwayat Pengeluaran</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />))}
              </div>
            ) : (
              <ExpenseList startDate={dateRange?.startDate} endDate={dateRange?.endDate} />
            )}
          </div>
        </FadeIn>
        )}

        {/* Income History */}
        {showReport && (
        <FadeIn delay={0.35}>
          <div className="bento-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">Riwayat Pemasukan</h3>
            <IncomeList startDate={dateRange?.startDate} endDate={dateRange?.endDate} />
          </div>
        </FadeIn>
        )}
      </main>

      <AiQuery />
    </>
  );
}
