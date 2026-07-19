import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface ImportTransaction {
  date: string;
  description: string;
  amount: number;
  type: string; // "expense" | "income"
  balance: number;
  categoryId: string;
  merchant: string;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { transactions } = body as { transactions: ImportTransaction[] };

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada transaksi untuk diimport" },
        { status: 400 }
      );
    }

    // Validate each transaction
    const errors: { index: number; error: string }[] = [];
    const validTransactions: ImportTransaction[] = [];

    transactions.forEach((t, i) => {
      const tErrors: string[] = [];
      if (!t.date) tErrors.push("tanggal required");
      if (!t.amount || t.amount <= 0) tErrors.push("amount harus > 0");
      if (!t.categoryId) tErrors.push("categoryId required");

      if (tErrors.length > 0) {
        errors.push({ index: i, error: tErrors.join(", ") });
      } else {
        validTransactions.push(t);
      }
    });

    console.log(`[import] Valid: ${validTransactions.length}, Total: ${transactions.length}`);

    if (validTransactions.length === 0) {
      return NextResponse.json(
        { error: "Semua transaksi tidak valid", details: errors },
        { status: 422 }
      );
    }

    // Debug: check first categoryId exists
    if (validTransactions.length > 0) {
      const firstCat = await prisma.category.findUnique({ where: { id: validTransactions[0].categoryId } });
      console.log(`[import] Sample categoryId: ${validTransactions[0].categoryId}, found: ${!!firstCat}`);
    }

    // Batch create expenses
    let imported = 0;
    const created: { id: string; amount: number; merchant: string; date: string }[] = [];
    const importErrors: { index: number; error: string }[] = [];

    for (let i = 0; i < validTransactions.length; i++) {
      const t = validTransactions[i];
      try {
        const expense = await prisma.expense.create({
          data: {
            userId: user.id,
            amount: t.amount,
            currency: "IDR",
            categoryId: t.categoryId,
            type: t.type || "expense",
            merchant: t.merchant || null,
            notes: `Import dari bank statement: ${t.description.substring(0, 200)}`,
            date: new Date(t.date),
          },
        });
        created.push({
          id: expense.id,
          amount: expense.amount,
          merchant: expense.merchant || "",
          date: expense.date.toISOString().split("T")[0],
        });
        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        importErrors.push({ index: i, error: msg });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed: importErrors.length,
      errors: importErrors.length > 0 ? importErrors : undefined,
      transactions: created,
    });
  } catch (error) {
    console.error("Bank statement import error:", error);
    const message =
      error instanceof Error ? error.message : "Gagal mengimport transaksi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
