import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
  /** Extracted total amount (best guess) */
  totalAmount?: number;
  /** Extracted date (best guess) */
  date?: string;
  /** Extracted merchant name (best guess) */
  merchant?: string;
}

/**
 * Run OCR on a receipt/screenshot image.
 * Processes the image with Tesseract.js and returns extracted text + parsed data.
 */
export async function scanReceipt(imageFile: File): Promise<OcrResult> {
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  const { data } = await Tesseract.recognize(imageBuffer, "eng", {
    logger: (info) => {
      if (info.status === "recognizing text") {
        console.log(`OCR progress: ${Math.round(info.progress * 100)}%`);
      }
    },
  });

  const text = data.text;
  const confidence = data.confidence;

  return {
    text,
    confidence,
    totalAmount: extractAmount(text),
    date: extractDate(text),
    merchant: extractMerchant(text),
  };
}

/**
 * Try to extract a monetary amount from OCR text.
 * Looks for patterns like "Rp 50.000", "Total: 150000", etc.
 */
function extractAmount(text: string): number | undefined {
  const patterns = [
    /(?:total|jumlah|rp|idr)\s*:?\s*(?:rp\s*)?([\d.,]+)/gi,
    /(?:rp|idr)\s*([\d.,]+)/gi,
    /([\d.,]+)\s*(?:rp|idr)/gi,
  ];

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length > 0) {
      // Take the last match (usually total is at the bottom of receipt)
      const lastMatch = matches[matches.length - 1][1];
      const cleaned = lastMatch.replace(/\./g, "").replace(",", ".");
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return undefined;
}

/**
 * Try to extract a date from OCR text.
 */
function extractDate(text: string): string | undefined {
  const patterns = [
    /(\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4})/gi,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/g,
    /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/g,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * Try to extract a merchant name from OCR text.
 * Usually the first line or the store name at the top of a receipt.
 */
function extractMerchant(text: string): string | undefined {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  // First non-empty line is often the merchant/store name
  return lines[0]?.trim() || undefined;
}
