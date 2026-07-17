import { NextResponse } from "next/server";
import { scanReceipt } from "@/lib/ocr";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File foto diperlukan" }, { status: 400 });
    }

    // Upload image to user's own Next.js API route as storage
    // Simple approach: store as base64 data URL (works for receipt-size images)
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

    // Run OCR
    const ocrResult = await scanReceipt(file);

    return NextResponse.json({
      ocr: ocrResult,
      receiptImageUrl: dataUrl,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "Gagal memproses OCR" }, { status: 500 });
  }
}
