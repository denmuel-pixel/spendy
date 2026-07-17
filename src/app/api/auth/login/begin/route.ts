import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLoginOptions } from "@/lib/webauthn-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan. Silakan daftar terlebih dahulu." },
        { status: 404 }
      );
    }

    if (!user.webauthnCredential) {
      return NextResponse.json(
        { error: "Belum ada kredensial WebAuthn. Silakan daftar ulang." },
        { status: 400 }
      );
    }

    const credential = user.webauthnCredential as { id: string; publicKey: string; counter: number };

    const options = await generateLoginOptions(user.id, credential.id);

    return NextResponse.json({
      userId: user.id,
      options,
    });
  } catch (error) {
    console.error("Login begin error:", error);
    return NextResponse.json({ error: "Gagal memulai login" }, { status: 500 });
  }
}
