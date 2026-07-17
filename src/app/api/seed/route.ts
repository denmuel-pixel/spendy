import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Makanan & Minuman", icon: "utensils", color: "#F97316", type: "expense" },
  { name: "Transportasi", icon: "car", color: "#3B82F6", type: "expense" },
  { name: "Belanja", icon: "shopping-bag", color: "#EC4899", type: "expense" },
  { name: "Hiburan", icon: "film", color: "#8B5CF6", type: "expense" },
  { name: "Kesehatan", icon: "heart-pulse", color: "#EF4444", type: "expense" },
  { name: "Tagihan & Utilitas", icon: "zap", color: "#F59E0B", type: "expense" },
  { name: "Pendidikan", icon: "book-open", color: "#06B6D4", type: "expense" },
  { name: "Olahraga", icon: "dumbbell", color: "#10B981", type: "expense" },
  { name: "Grooming", icon: "scissors", color: "#D946EF", type: "expense" },
  { name: "Investasi", icon: "trending-up", color: "#22C55E", type: "expense" },
  { name: "Gaji", icon: "briefcase", color: "#10B981", type: "income" },
  { name: "Freelance", icon: "laptop", color: "#6366F1", type: "income" },
  { name: "Lainnya", icon: "ellipsis", color: "#6B7280", type: "expense" },
];

export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await prisma.category.findFirst({
        where: { name: cat.name, isDefault: true },
      });

      if (!existing) {
        await prisma.category.create({
          data: { ...cat, isDefault: true },
        });
        created++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: DEFAULT_CATEGORIES.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Gagal seed data" }, { status: 500 });
  }
}
