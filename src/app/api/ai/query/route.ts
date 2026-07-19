import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { aiQuery } from "@/lib/deepseek";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Pertanyaan diperlukan" }, { status: 400 });
    }

    // Fetch expenses from last 12 months for analysis context
    const twelveMonthsAgo = subMonths(new Date(), 12);
    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        date: { gte: twelveMonthsAgo },
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Separate expense & income
    const pengeluaran = expenses.filter((e) => e.type !== "income");
    const pemasukan = expenses.filter((e) => e.type === "income");

    // Build category aggregation for expenses
    const categoryMap = new Map<
      string,
      { total: number; count: number }
    >();
    for (const exp of pengeluaran) {
      const catName = exp.category.name;
      const existing = categoryMap.get(catName);
      if (existing) {
        existing.total += exp.amount;
        existing.count += 1;
      } else {
        categoryMap.set(catName, { total: exp.amount, count: 1 });
      }
    }

    const totalPengeluaran = pengeluaran.reduce((sum, e) => sum + e.amount, 0);
    const totalPemasukan = pemasukan.reduce((sum, e) => sum + e.amount, 0);

    const context = {
      summary: {
        totalPengeluaran,
        totalPemasukan,
        totalTransaksi: expenses.length,
        selisih: totalPemasukan - totalPengeluaran,
      },
      kategori: Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        total: Math.round(data.total),
        count: data.count,
      })),
      pemasukanTerbaru: pemasukan.slice(0, 20).map((e) => ({
        merchant: e.merchant || "(tanpa nama)",
        amount: Math.round(e.amount),
        kategori: e.category.name,
        date: e.date.toISOString().split("T")[0],
      })),
      transaksiTerbaru: pengeluaran.slice(0, 30).map((e) => ({
        merchant: e.merchant || "(tanpa nama)",
        amount: Math.round(e.amount),
        kategori: e.category.name,
        date: e.date.toISOString().split("T")[0],
      })),
    };

    const result = await aiQuery(query, context);

    return NextResponse.json({
      success: true,
      jawaban: result.jawaban,
    });
  } catch (error) {
    console.error("AI query error:", error);
    const message =
      error instanceof Error ? error.message : "Gagal memproses pertanyaan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
