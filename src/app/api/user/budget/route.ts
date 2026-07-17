import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { monthlyBudget: true },
    });

    return NextResponse.json({ budget: dbUser?.monthlyBudget || 5000000 });
  } catch (error) {
    console.error("Budget fetch error:", error);
    return NextResponse.json({ error: "Gagal memuat budget" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { budget } = body;

    if (!budget || budget < 10000) {
      return NextResponse.json({ error: "Budget minimal Rp 10.000" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { monthlyBudget: parseFloat(budget) },
    });

    return NextResponse.json({ success: true, budget: parseFloat(budget) });
  } catch (error) {
    console.error("Budget update error:", error);
    return NextResponse.json({ error: "Gagal menyimpan budget" }, { status: 500 });
  }
}
