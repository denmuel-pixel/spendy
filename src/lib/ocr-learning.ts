/**
 * OCR Correction Cache — learns from user corrections
 * 
 * When a user scans a receipt and corrects the amount/merchant,
 * we save the correction. Next time OCR finds similar text,
 * we apply the learned correction.
 */

const STORAGE_KEY = "spendy-ocr-corrections";
const SIMILARITY_THRESHOLD = 0.6;

interface OcrCorrection {
  ocrRawText: string;
  correctedAmount?: number;
  correctedMerchant?: string;
  createdAt: number;
  count: number;
}

function getCorrections(): OcrCorrection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCorrections(corrections: OcrCorrection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
}

// Simple text similarity (Jaccard-like on character bigrams)
function textSimilarity(a: string, b: string): number {
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();
  if (!aNorm || !bNorm) return 0;
  if (aNorm === bNorm) return 1;

  // Character bigrams
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < aNorm.length - 1; i++) bigramsA.add(aNorm.slice(i, i + 2));
  for (let i = 0; i < bNorm.length - 1; i++) bigramsB.add(bNorm.slice(i, i + 2));

  let intersection = 0;
  for (const b of bigramsA) if (bigramsB.has(b)) intersection++;

  const union = new Set([...bigramsA, ...bigramsB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Save a user correction after OCR
 */
export function saveOcrCorrection(
  ocrRawText: string,
  correctedAmount?: number,
  correctedMerchant?: string
) {
  const corrections = getCorrections();
  
  // Check if similar correction exists
  const existing = corrections.find(
    (c) => textSimilarity(c.ocrRawText, ocrRawText) > 0.8
  );

  if (existing) {
    existing.count += 1;
    existing.createdAt = Date.now();
    if (correctedAmount !== undefined) existing.correctedAmount = correctedAmount;
    if (correctedMerchant !== undefined) existing.correctedMerchant = correctedMerchant;
  } else {
    corrections.push({
      ocrRawText: ocrRawText.slice(0, 200), // limit size
      correctedAmount,
      correctedMerchant,
      createdAt: Date.now(),
      count: 1,
    });
  }

  // Keep max 50 entries
  if (corrections.length > 50) {
    corrections.sort((a, b) => b.count - a.count);
    corrections.length = 50;
  }

  saveCorrections(corrections);
}

/**
 * Look up corrections for OCR text
 */
export function lookupOcrCorrection(
  ocrRawText: string
): { amount?: number; merchant?: string } | null {
  const corrections = getCorrections();
  if (corrections.length === 0) return null;

  // Find best match by similarity
  let best: OcrCorrection | null = null;
  let bestScore = 0;

  for (const c of corrections) {
    const score = textSimilarity(c.ocrRawText, ocrRawText);
    if (score > bestScore && score >= SIMILARITY_THRESHOLD) {
      bestScore = score;
      best = c;
    }
  }

  if (!best) return null;

  const result: { amount?: number; merchant?: string } = {};
  if (best.correctedAmount !== undefined) result.amount = best.correctedAmount;
  if (best.correctedMerchant !== undefined) result.merchant = best.correctedMerchant;
  return Object.keys(result).length > 0 ? result : null;
}
