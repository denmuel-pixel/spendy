import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { aiQuery } from "@/lib/deepseek";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

// Kata kunci yang akan dicari di database
function extractKeywords(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  // Ambil kata yang relevan (min 3 chars, bukan kata umum)
  const stopWords = new Set(["yang", "dengan", "untuk", "dari", "saya", "kamu", "ada", "dan", "di", "ke", "apa", "bagaimana", "kapan", "siapa", "dimana", "kenapa", "tolong", "cari", "cek", "lihat", "tampilkan", "berdasarkan", "data", "bulan", "tahun", "transaksi", "pengeluaran", "pemasukan", "total", "rata", "rata"]);
  return words.filter(w => w.length >= 3 && !stopWords.has(w));
}

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

    const keywords = extractKeywords(query);
    console.log("[ai] Keywords extracted:", keywords);

    // Hybrid search: cari di database berdasarkan keyword
    const twelveMonthsAgo = subMonths(new Date(), 12);
    const dbFilter: any = {
      userId: user.id,
      date: { gte: twelveMonthsAgo },
    };

    // Jika ada keyword spesifik, cari di merchant/notes
    if (keywords.length > 0) {
      dbFilter.OR = keywords.map((kw) => ({
        OR: [
          { merchant: { contains: kw, mode: "insensitive" as const } },
          { notes: { contains: kw, mode: "insensitive" as const } },
        ],
      }));
    }

    const expenses = await prisma.expense.findMany({
      where: dbFilter,
      include: {
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    // Separate expense & income
    const pengeluaran = expenses.filter((e) => e.type !== "income");
    const pemasukan = expenses.filter((e) => e.type === "income");

    // Build category aggregation
    const categoryMap = new Map<string, { total: number; count: number }>();
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
        keywordPencarian: keywords.length > 0 ? keywords.join(", ") : "semua transaksi",
      },
      kategori: Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        total: Math.round(data.total),
        count: data.count,
      })),
      pemasukanTerbaru: pemasukan.slice(0, 50).map((e) => ({
        merchant: e.merchant || "(tanpa nama)",
        amount: Math.round(e.amount),
        kategori: e.category.name,
        date: e.date.toISOString().split("T")[0],
      })),
      transaksiTerbaru: pengeluaran.slice(0, 100).map((e) => ({
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
