import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const EXAMPLE_TRANSACTIONS = [
  { amount: 55000,  merchant: "Starbucks Coffee",    category: "Makanan & Minuman", date: "2026-07-17", notes: "Coffee date" },
  { amount: 32000,  merchant: "GrabCar Ride",        category: "Transportasi",       date: "2026-07-17" },
  { amount: 128000, merchant: "Indomaret Minimarket", category: "Belanja",           date: "2026-07-16" },
  { amount: 45000,  merchant: "GO-FOOD Delivery",    category: "Makanan & Minuman", date: "2026-07-16" },
  { amount: 150000, merchant: "Pertamina",            category: "Transportasi",       date: "2026-07-15" },
  { amount: 90000,  merchant: "Cinema XXI",           category: "Hiburan",           date: "2026-07-14", notes: "Movie night" },
  { amount: 399000, merchant: "Uniqlo Indonesia",     category: "Belanja",           date: "2026-07-12" },
  { amount: 54900,  merchant: "Spotify Premium",      category: "Hiburan",           date: "2026-07-10" },
  { amount: 28000,  merchant: "Kopi Kenangan",        category: "Makanan & Minuman", date: "2026-07-09" },
  { amount: 65000,  merchant: "Bluebird Taxi",        category: "Transportasi",       date: "2026-07-08" },
  { amount: 120000, merchant: "Sushi Tei",            category: "Makanan & Minuman", date: "2026-07-07", notes: "Lunch with team" },
  { amount: 75000,  merchant: "Toko Buku Gramedia",   category: "Pendidikan",        date: "2026-07-06" },
  { amount: 250000, merchant: "Apotek Kimia Farma",   category: "Kesehatan",         date: "2026-07-05", notes: "Obat batuk" },
  { amount: 42000,  merchant: "Chatime",              category: "Makanan & Minuman", date: "2026-07-04" },
  { amount: 85000,  merchant: "Bensin Shell",         category: "Transportasi",       date: "2026-07-03" },
];

async function getCategoryMap() {
  const categories = await prisma.category.findMany({
    where: { type: "expense" },
  });
  const map = new Map<string, string>();
  for (const cat of categories) map.set(cat.name, cat.id);
  return map;
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login dulu ya!" }, { status: 401 });
    }

    const categoryMap = await getCategoryMap();
    let created = 0;
    let skipped = 0;

    for (const tx of EXAMPLE_TRANSACTIONS) {
      const categoryId = categoryMap.get(tx.category);
      if (!categoryId) { skipped++; continue; }

      const existing = await prisma.expense.findFirst({
        where: { userId: user.id, merchant: tx.merchant, amount: tx.amount, date: new Date(tx.date) },
      });

      if (!existing) {
        await prisma.expense.create({
          data: {
            userId: user.id,
            amount: tx.amount,
            categoryId,
            merchant: tx.merchant,
            notes: tx.notes || null,
            date: new Date(tx.date),
          },
        });
        created++;
      } else skipped++;
    }

    return NextResponse.json({
      success: true,
      message: `${created} transaksi contoh ditambahkan, ${skipped} sudah ada`,
      created, skipped,
    });
  } catch (error) {
    console.error("Seed data error:", error);
    return NextResponse.json({ error: "Gagal seed data" }, { status: 500 });
  }
}
