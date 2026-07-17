import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRegisterResponse } from "@/lib/webauthn-server";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId, credential } = await req.json();

    if (!userId || !credential) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const result = await verifyRegisterResponse(userId, credential);

    // Save credential to user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        webauthnCredential: result.credential,
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
    console.error("Register complete error:", error);
    const message = error instanceof Error ? error.message : "Gagal verifikasi registrasi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
