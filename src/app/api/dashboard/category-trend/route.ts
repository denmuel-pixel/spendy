import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    if (!categoryId) {
      return NextResponse.json({ error: "categoryId required" }, { status: 400 });
    }

    const rangeMonths = parseInt(searchParams.get("months") || "6", 10);
    const count = Math.max(1, Math.min(12, rangeMonths));

    // Dynamic month range
    const months: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      months.push({ label, start: d, end });
    }

    const result = await Promise.all(
      months.map(async (m) => {
        const agg = await prisma.expense.aggregate({
          where: {
            userId: user.id,
            categoryId,
            date: { gte: m.start, lte: m.end },
          },
          _sum: { amount: true },
          _count: true,
        });
        return {
          month: m.label,
          amount: agg._sum.amount || 0,
          count: agg._count,
        };
      })
    );

    // Get category info
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, color: true, icon: true },
    });

    return NextResponse.json({ category, data: result });
  } catch (error) {
    console.error("Category trend error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
