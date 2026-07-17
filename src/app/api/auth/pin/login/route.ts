import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return NextResponse.json({ error: "Email dan PIN diperlukan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.pinHash) {
      return NextResponse.json(
        { error: "PIN tidak ditemukan. Silakan daftar dengan WebAuthn terlebih dahulu." },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(pin, user.pinHash);

    if (!isValid) {
      return NextResponse.json({ error: "PIN salah" }, { status: 401 });
    }

    await createSession(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("PIN login error:", error);
    return NextResponse.json({ error: "Gagal login dengan PIN" }, { status: 500 });
  }
}
