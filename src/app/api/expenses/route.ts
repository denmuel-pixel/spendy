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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const type = searchParams.get("type"); // "expense" | "income"

    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + "T23:59:59.999Z");
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { merchant: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Expenses list error:", error);
    return NextResponse.json({ error: "Gagal memuat pengeluaran" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, categoryId, merchant, notes, date, paymentMethod, receiptImageUrl, ocrRawText } = body;

    if (!amount || !categoryId || !date) {
      return NextResponse.json(
        { error: "Amount, kategori, dan tanggal diperlukan" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        categoryId,
        merchant: merchant || null,
        notes: notes || null,
        date: new Date(date),
        paymentMethod: paymentMethod || null,
        receiptImageUrl: receiptImageUrl || null,
        ocrRawText: ocrRawText || null,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengeluaran" }, { status: 500 });
  }
}
