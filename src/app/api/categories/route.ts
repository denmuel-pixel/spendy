import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isDefault: true },
          { userId: user.id },
        ],
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nama kategori diperlukan" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color || "#6B7280",
        userId: user.id,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}
