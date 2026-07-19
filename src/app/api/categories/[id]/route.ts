import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the category exists and belongs to user or is default
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Allow deleting default categories as well, as long as user is authenticated.
    if (category.userId !== user.id && !category.isDefault) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if category has expenses — if yes, reassign or block
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      // Find a "Lainnya" or default category to reassign
      const fallback = await prisma.category.findFirst({
        where: { isDefault: true, type: "expense" },
      });

      if (fallback) {
        await prisma.expense.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallback.id },
        });
      }
    }

    // Delete the category
    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
