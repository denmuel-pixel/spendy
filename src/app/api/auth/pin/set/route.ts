import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pin } = await req.json();

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN harus 4-6 digit angka" },
        { status: 400 }
      );
    }

    const pinHash = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PIN set error:", error);
    return NextResponse.json({ error: "Gagal menyimpan PIN" }, { status: 500 });
  }
}
