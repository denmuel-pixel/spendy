import { NextResponse } from "next/server";
import { scanReceipt } from "@/lib/ocr";
import { getCurrentUser } from "@/lib/auth";
import { uploadReceiptImage } from "@/lib/supabase";

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

    // Upload image to Supabase Storage
    const imageUrl = await uploadReceiptImage(file, user.id);

    // Run OCR
    const ocrResult = await scanReceipt(file);

    return NextResponse.json({
      ocr: ocrResult,
      receiptImageUrl: imageUrl,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "Gagal memproses OCR" }, { status: 500 });
  }
}
