import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseBankStatement } from "@/lib/deepseek";
import { extractPdfText } from "@/lib/pdf-extract";

const VALID_BANK_TYPES = ["bca", "danamon", "mega"] as const;
type BankType = (typeof VALID_BANK_TYPES)[number];

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bankType = (formData.get("bankType") as string)?.toLowerCase() || "bca";

    if (!file) {
      return NextResponse.json({ error: "File PDF diperlukan" }, { status: 400 });
    }

    if (!VALID_BANK_TYPES.includes(bankType as BankType)) {
      return NextResponse.json(
        { error: `Bank tidak didukung. Pilihan: ${VALID_BANK_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "File harus berupa PDF" }, { status: 400 });
    }

    // Read PDF file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using pdfjs-dist
    let pdfText: string;
    try {
      pdfText = await extractPdfText(buffer);
    } catch (pdfError) {
      console.error("PDF extraction error:", pdfError);
      const msg = pdfError instanceof Error ? pdfError.message : "Unknown error";
      return NextResponse.json(
        { error: `Gagal mengekstrak teks dari PDF: ${msg}` },
        { status: 422 }
      );
    }

    if (!pdfText || pdfText.trim().length < 20) {
      return NextResponse.json(
        { error: "Teks tidak ditemukan dalam PDF. File mungkin kosong atau hanya berisi gambar." },
        { status: 422 }
      );
    }

    // Send to DeepSeek for parsing
    const parseResult = await parseBankStatement(pdfText, bankType);

    if (parseResult.transactions.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada transaksi yang terdeteksi dari file ini." },
        { status: 422 }
      );
    }

    // Deduplicate transactions by date + description + amount
    const seen = new Set<string>();
    const uniqueTransactions = parseResult.transactions.filter((t) => {
      const key = `${t.date}|${t.description.trim()}|${t.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(
      `[bank-statement] ${parseResult.transactions.length} from API → ${uniqueTransactions.length} unique`
    );

    // Detect if this is a Tahapan (savings) account — credits = income
    const isTahapan =
      bankType === "bca" &&
      (pdfText.toLowerCase().includes("tahapan") ||
       pdfText.toLowerCase().includes("tabungan"));

    // Fetch user's categories for mapping
    const userCategories = await prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { userId: user.id }],
      },
      select: { id: true, name: true },
    });

    // Map suggested categories to actual category IDs
    const categoryMap = new Map<string, string>();
    for (const cat of userCategories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    // Find "Lainnya" fallback
    const fallbackCategory = userCategories.find(
      (c) => c.name.toLowerCase() === "lainnya"
    );
    const fallbackId = fallbackCategory?.id || userCategories[0]?.id;

    const transactions = uniqueTransactions.map((t) => {
      const suggestedLower = t.suggestedCategory?.toLowerCase() || "";
      const categoryId =
        categoryMap.get(suggestedLower) ||
        // Try partial match
        userCategories.find(
          (c) =>
            c.name.toLowerCase().includes(suggestedLower) ||
            suggestedLower.includes(c.name.toLowerCase())
        )?.id ||
        fallbackId;

      return {
        date: t.date,
        description: t.description,
        amount: Math.abs(t.amount), // always positive
        type: t.amount > 0 ? "income" : "expense", // positive = credit
        balance: t.balance,
        suggestedCategory: t.suggestedCategory,
        categoryId: categoryId || fallbackId,
        merchant: t.description.split("\n")[0].trim().substring(0, 100),
      };
    });

    // Filter: for Tahapan keep both income & expense; for others only expense
    const filteredTransactions = isTahapan
      ? transactions
      : transactions.filter((t) => t.type === "expense");

    console.log(
      `[bank-statement] ${transactions.length} after dedup → ${filteredTransactions.length} after filter (isTahapan: ${isTahapan})`
    );

    return NextResponse.json({
      success: true,
      bankType,
      total: filteredTransactions.length,
      transactions: filteredTransactions,
    });
  } catch (error) {
    console.error("Bank statement parse error:", error);
    const message =
      error instanceof Error ? error.message : "Gagal memproses file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
