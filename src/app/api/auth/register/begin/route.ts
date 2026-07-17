import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRegisterOptions } from "@/lib/webauthn-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email diperlukan" }, { status: 400 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // User exists — check if they already have a WebAuthn credential
      if (user.webauthnCredential) {
        return NextResponse.json(
          { error: "Pengguna sudah terdaftar dengan WebAuthn. Silakan login." },
          { status: 409 }
        );
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: { email },
      });
    }

    const options = await generateRegisterOptions(user.id, email);

    return NextResponse.json({
      userId: user.id,
      options,
    });
  } catch (error) {
    console.error("Register begin error:", error);
    return NextResponse.json({ error: "Gagal memulai registrasi" }, { status: 500 });
  }
}
