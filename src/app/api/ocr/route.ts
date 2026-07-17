import { NextResponse } from "next/server";
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

    // Convert image to base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      receiptImageUrl: dataUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload" }, { status: 500 });
  }
}
