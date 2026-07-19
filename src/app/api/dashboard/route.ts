import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    const now = new Date();
    const monthStart = startParam ? new Date(startParam) : startOfMonth(now);
    const monthEnd = endParam ? new Date(endParam + "T23:59:59.999Z") : endOfMonth(now);

    // Monthly summary
    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { date: "desc" },
    });

    const totalThisMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const daysSoFar = Math.max(1, now.getDate());
    const dailyAverage = totalThisMonth / daysSoFar;

    // Separate expenses and income (treat null as expense for backward compat)
    const expenseTotal = monthlyExpenses
      .filter((e) => e.type !== "income")
      .reduce((sum, e) => sum + e.amount, 0);
    const incomeTotal = monthlyExpenses
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);

    // Spending by category (expenses only)
    const categoryMap = new Map<string, { name: string; color: string; total: number; count: number }>();
    for (const exp of monthlyExpenses) {
      const catId = exp.categoryId;
      const existing = categoryMap.get(catId);
      if (existing) {
        existing.total += exp.amount;
        existing.count += 1;
      } else {
        categoryMap.set(catId, {
          name: exp.category.name,
          color: exp.category.color,
          total: exp.amount,
          count: 1,
        });
      }
    }

    const categories = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        categoryId: id,
        ...data,
        percentage: totalThisMonth > 0 ? Math.round((data.total / totalThisMonth) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Top category
    const topCategory = categories.length > 0 ? {
      name: categories[0].name,
      amount: categories[0].total,
      percentage: categories[0].percentage,
    } : null;

    // Daily spending for chart
    const daysRange = startParam && endParam
      ? Math.ceil((new Date(endParam).getTime() - new Date(startParam).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 30;
    const chartStart = startParam ? new Date(startParam) : new Date(new Date().setDate(new Date().getDate() - 30));
    const chartEnd = endParam ? new Date(endParam + "T23:59:59.999Z") : new Date();

    const dailyExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        date: { gte: chartStart, lte: chartEnd },
      },
      select: { amount: true, date: true },
      orderBy: { date: "asc" },
    });

    const dailyMap = new Map<string, number>();
    for (let i = 0; i < daysRange; i++) {
      const d = new Date(chartStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, 0);
    }
    for (const exp of dailyExpenses) {
      const key = exp.date.toISOString().split("T")[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + exp.amount);
    }

    const dailySpending = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    // Recent transactions (last 5)
    const recentTransactions = monthlyExpenses.slice(0, 5).map((e) => ({
      id: e.id,
      amount: e.amount,
      merchant: e.merchant,
      categoryName: e.category.name,
      categoryColor: e.category.color,
      date: e.date,
      notes: e.notes,
    }));

    return NextResponse.json({
      summary: {
        totalThisMonth,
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        transactionCount: monthlyExpenses.length,
        topCategory,
        expenseTotal: Math.round(expenseTotal),
        incomeTotal: Math.round(incomeTotal),
        netTotal: Math.round(incomeTotal - expenseTotal),
      },
      categories,
      dailySpending,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Gagal memuat dashboard" }, { status: 500 });
  }
}
