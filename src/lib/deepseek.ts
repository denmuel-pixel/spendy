// DeepSeek API client for bank statement parsing

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // negative = debit (pengeluaran), positive = kredit (pemasukan)
  balance: number;
  suggestedCategory: string;
}

export interface ParseResult {
  bankType: string;
  transactions: ParsedTransaction[];
  rawText: string;
}

function getBankPrompt(bankType: string): string {
  const basePrompt = `Anda adalah asisten yang ahli membaca laporan bank (bank statement) dari PDF.

Saya akan memberikan teks hasil ekstraksi dari PDF statement bank ${bankType.toUpperCase()}.
Tugas Anda adalah mengekstrak semua transaksi dan mengembalikannya dalam format PIPE-SEPARATED berikut (HANYA teks, tanpa markdown, tanpa penjelasan):

date|description|amount|balance|category
2026-06-01|TRSF E-BANKING DB|500000|1000000|Makanan & Minuman

ATURAN:
- amount: NEGATIF untuk debit/pengeluaran, POSITIF untuk kredit/pemasukan
- category: pilih dari: Makanan & Minuman, Transportasi, Belanja, Hiburan, Kesehatan, Tagihan & Utilitas, Pendidikan, Gaji, Investasi, Lainnya
- Setiap transaksi 1 baris, pipe-separated
- JANGAN sertakan header/baris lain selain data
- JANGAN sertakan baris transisi saldo atau mutasi awal/akhir
- Jika tidak ada transaksi, kirimkan "TIDAK_ADA_TRANSAKSI"`;

  const bankSpecific: Record<string, string> = {
    bca: ` FORMAT BANK BCA:
Ada dua jenis format BCA:

1. REGULER (e-statement biasa):
   - Kolom: Tanggal, Keterangan, Debit, Kredit, Saldo
   - Debit = pengeluaran (amount negatif)
   - Kredit = pemasukan (amount positif)

2. TAHAPAN (rekening tabungan):
   - Format khusus dengan tanda DB dan CR
   - DB (Debit) di dekat angka = DEBIT / pengeluaran (amount NEGATIF)
   - TANPA DB / tidak ada DB di dekat angka = KREDIT / pemasukan (amount POSITIF)
   - Penting: cari teks "DB" di baris transaksi. Jika ada DB → pengeluaran (negatif), jika tidak ada DB → pemasukan (positif)

Gabungkan baris keterangan yang terpisah menjadi satu deskripsi.`,
    danamon: ` FORMAT BANK DANAMON:
- Mutasi Danamon memiliki kolom: Tanggal, Keterangan, Debit, Kredit, Saldo
- Debit = pengeluaran (amount negatif)  
- Kredit = pemasukan (amount positif)
- Perhatikan format tanggal Danamon (biasanya DD/MM/YYYY)`,
    mega: ` FORMAT BANK MEGA:
- Mutasi Bank Mega memiliki kolom: Tanggal, Keterangan, Debit, Kredit, Saldo
- Debit = pengeluaran (amount negatif)/Mutasi Debet
- Kredit = pemasukan (amount positif)/Mutasi Kredit
- Perhatikan bahwa format bisa berbeda tergantung jenis rekening`,
  };

  return basePrompt + (bankSpecific[bankType] || "");
}

export async function parseBankStatement(
  text: string,
  bankType: string
): Promise<ParseResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY tidak ditemukan di environment");
  }

  const prompt = getBankPrompt(bankType);

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: "Anda adalah asisten yang hanya merespons dengan baris data pipe-separated. Tidak ada teks lain, tidak ada markdown." },
        { role: "user", content: `${prompt}\n\n---\n\nTeks statement bank:\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("DeepSeek API: tidak ada content dalam response");
  }

  // Log raw content for debugging
  console.log("[deepseek] Raw response length:", content.length);

  // Parse pipe-separated transaction data
  const lines = content.trim().split("\n");
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "TIDAK_ADA_TRANSAKSI" || trimmed.startsWith("date|")) continue;

    const parts = trimmed.split("|");
    if (parts.length < 5) continue;

    const [date, description, amountStr, balanceStr, ...catParts] = parts;
    const amount = parseFloat(amountStr);
    const balance = parseFloat(balanceStr);

    if (isNaN(amount) || isNaN(balance)) continue;

    transactions.push({
      date: date.trim(),
      description: description.trim(),
      amount,
      balance,
      suggestedCategory: catParts.join("|").trim(), // in case category has pipe
    });
  }

  console.log("[deepseek] Parsed transactions:", transactions.length);

  // Validate transactions
  if (!Array.isArray(transactions)) {
    throw new Error("DeepSeek API: response bukan array");
  }

  // Filter out invalid entries and ensure required fields
  const validTransactions = transactions.filter((t: any) => {
    return t.date && t.description && typeof t.amount === "number";
  });

  return {
    bankType,
    transactions: validTransactions,
    rawText: text,
  };
}

export interface AiQueryContext {
  summary: {
    totalPengeluaran: number;
    totalPemasukan: number;
    totalTransaksi: number;
    selisih: number;
    keywordPencarian: string;
  };
  kategori: { name: string; total: number; count: number }[];
  pemasukanTerbaru: { merchant: string; amount: number; kategori: string; date: string }[];
  transaksiTerbaru: { merchant: string; amount: number; kategori: string; date: string }[];
}

export interface AiQueryResult {
  jawaban: string;
  data?: any;
}

export async function aiQuery(
  pertanyaan: string,
  context: AiQueryContext
): Promise<AiQueryResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY tidak ditemukan di environment");
  }

  const systemPrompt = `Anda adalah asisten keuangan pribadi untuk aplikasi Spendy.
Tugas Anda adalah menjawab pertanyaan pengguna tentang data pengeluaran DAN pemasukan mereka.

DATA KEUANGAN PENGGUNA:
- Total pengeluaran: Rp ${context.summary.totalPengeluaran.toLocaleString("id-ID")}
- Total pemasukan: Rp ${context.summary.totalPemasukan.toLocaleString("id-ID")}
- Selisih: Rp ${context.summary.selisih.toLocaleString("id-ID")}
- Jumlah transaksi: ${context.summary.totalTransaksi}
- Pencarian: ${context.summary.keywordPencarian}

RINCIAN PENGELUARAN PER KATEGORI:
${context.kategori
  .map(
    (k) =>
      `- ${k.name}: Rp ${k.total.toLocaleString("id-ID")} (${k.count} transaksi)`
  )
  .join("\n")}

PEMASUKAN TERBARU:
${context.pemasukanTerbaru
  .map(
    (t) =>
      `- ${t.date}: ${t.merchant} — Rp ${t.amount.toLocaleString("id-ID")} (${t.kategori})`
  )
  .join("\n")}

TRANSAKSI PENGELUARAN TERBARU:
${context.transaksiTerbaru
  .map(
    (t) =>
      `- ${t.date}: ${t.merchant} — Rp ${t.amount.toLocaleString("id-ID")} (${t.kategori})`
  )
  .join("\n")}

Instruksi:
1. Jawab pertanyaan pengguna berdasarkan data di atas
2. Gunakan bahasa Indonesia yang natural dan friendly
3. Jika ditanya tentang merchant tertentu, cari di daftar transaksi
4. Jika data tidak cukup, katakan dengan jujur
5. Berikan angka dalam format Rupiah (Rp)
6. Jawab dengan singkat dan padat, maksimal 3-4 kalimat`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pertanyaan },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const jawaban = data.choices?.[0]?.message?.content || "Maaf, tidak bisa menjawab pertanyaan.";

  return { jawaban };
}
