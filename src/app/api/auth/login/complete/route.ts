import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLoginResponse } from "@/lib/webauthn-server";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId, credential } = await req.json();

    if (!userId || !credential) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Get user's stored credential
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.webauthnCredential) {
      return NextResponse.json(
        { error: "Kredensial tidak ditemukan" },
        { status: 404 }
      );
    }

    const storedCredential = user.webauthnCredential as { id: string; publicKey: string; counter: number };

    const result = await verifyLoginResponse(userId, credential, storedCredential);

    // Update credential counter
    await prisma.user.update({
      where: { id: userId },
      data: {
        webauthnCredential: {
          ...storedCredential,
          counter: result.newCounter,
        },
      },
    });

    // Create session
    await createSession(user.id, user.email);

    return NextResponse.json({
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login complete error:", error);
    const message = error instanceof Error ? error.message : "Gagal verifikasi login";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
