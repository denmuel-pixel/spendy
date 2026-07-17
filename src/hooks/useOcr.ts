"use client";

import { useState, useCallback, useRef } from "react";
import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
  totalAmount?: number;
  date?: string;
  merchant?: string;
}

interface OcrProgress {
  status: string;
  progress: number;
}

export function useOcr() {
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const workerRef = useRef<Promise<any> | null>(null);

  const ensureWorker = useCallback(async () => {
    if (!workerRef.current) {
      workerRef.current = Tesseract.createWorker("eng+ind", 1, {
        logger: (info) => {
          setProgress({
            status: info.status,
            progress: info.progress || 0,
          });
        },
      });
    }
    return workerRef.current;
  }, []);

  const scanReceipt = useCallback(async (file: File): Promise<OcrResult> => {
    setIsScanning(true);
    setProgress({ status: "initializing", progress: 0 });
    setResult(null);

    try {
      const worker = await ensureWorker();
      
      setProgress({ status: "recognizing", progress: 0 });
      
      // Configure for receipt text (single column, sparse text)
      await worker.setParameters({
        tessedit_pageseg_mode: "6", // Assume uniform block of text
      });
      
      const { data } = await worker.recognize(file);
      
      const text = data.text;
      const confidence = data.confidence;

      const ocrResult: OcrResult = {
        text,
        confidence,
        totalAmount: extractAmount(text),
        date: extractDate(text),
        merchant: extractMerchant(text),
      };

      setResult(ocrResult);
      return ocrResult;
    } finally {
      setIsScanning(false);
      setProgress(null);
    }
  }, [ensureWorker]);

  const terminateWorker = useCallback(async () => {
    if (workerRef.current) {
      const worker = await workerRef.current;
      await worker.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    scanReceipt,
    terminateWorker,
    progress,
    isScanning,
    result,
  };
}

function extractAmount(text: string): number | undefined {
  // Normalize text: lowercase, collapse spaces
  const normalized = text.toLowerCase().replace(/\s+/g, " ");

  // Collect all found amounts with their context (line before and after)
  const candidates: { amount: number; line: string; priority: number }[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Helper: parse Indonesian number format ("50.000" = 50000, "50,50" = 50.50)
  const parseIdr = (s: string): number | null => {
    // If has comma then dot, the comma is decimal: "1.234,50" → 1234.50
    if (s.includes(",") && s.includes(".")) {
      const cleaned = s.replace(/\./g, "").replace(",", ".");
      const val = parseFloat(cleaned);
      return isNaN(val) ? null : val;
    }
    // If only commas, treat commas as decimal: "1234,50" → 1234.50
    if (s.includes(",")) {
      const cleaned = s.replace(",", ".");
      const val = parseFloat(cleaned);
      return isNaN(val) ? null : val;
    }
    // If only dots, treat dots as thousand separators: "1.234" → 1234
    if (s.includes(".")) {
      const cleaned = s.replace(/\./g, "");
      const val = parseInt(cleaned, 10);
      return isNaN(val) ? null : val;
    }
    const val = parseInt(s, 10);
    return isNaN(val) ? null : val;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Look for "total" keywords in the current line
    const isTotalLine = /^(sub\s*)?total|jumlah|grand\s*total|belanja|bayar|pembayaran|cash|tunai|kembali/i.test(lineLower);
    
    // Find all currency-like values on this line
    const numberMatches = line.match(/(?:rp\s*)?([\d.,]+)/gi) || [];
    
    for (const raw of numberMatches) {
      const cleaned = raw.replace(/^rp\s*/i, "").trim();
      const amount = parseIdr(cleaned);
      if (amount === null || amount <= 0) continue;

      // Determine priority
      let priority = 0; // low

      // Line has "total" keyword → high priority
      if (isTotalLine) priority = 3;
      
      // Has explicit Rp prefix → medium priority
      if (/^rp\s*/i.test(raw)) priority = Math.max(priority, 2);

      // Near the end of receipt (last 30% lines) → slightly higher
      if (i > lines.length * 0.7) priority = Math.max(priority, 1);

      candidates.push({ amount, line: lineLower, priority });
    }
  }

  if (candidates.length === 0) return undefined;

  // Sort by priority desc, then by amount desc (prefer larger = total)
  candidates.sort((a, b) => b.priority - a.priority || b.amount - a.amount);

  // If top candidate is on a "total" line, use it
  const top = candidates[0];
  if (top.priority >= 2) return top.amount;

  // Fallback: return the largest amount found
  return Math.max(...candidates.map((c) => c.amount));
}

function extractDate(text: string): string | undefined {
  // Look for date patterns in the text, prefer later matches (bottom of receipt)
  const datePatterns = [
    /(\d{1,2}[/-]\d{1,2}[/-]\d{4})/g,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2})/g,
    /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/g,
    /(\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4})/gi,
  ];

  let lastDate: string | undefined;
  for (const pattern of datePatterns) {
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length > 0) {
      lastDate = matches[matches.length - 1][1];
    }
  }
  return lastDate;
}

function extractMerchant(text: string): string | undefined {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  
  // Candidate lines for merchant name (early in receipt, all caps or title case)
  const candidates: string[] = [];
  
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Skip lines that look like addresses, dates, prices, or common receipt headers
    if (
      line.length < 3 ||
      line.length > 60 ||
      /^\d/.test(line) ||
      /^(no|telp|fax|alamat|tanggal|date|time|jam|kasir|cashier|member|npwp|invoice|receipt|order|meja|table)/i.test(lineLower) ||
      /rp\s*[\d.,]/i.test(line) ||
      /[\d.,]+/.test(line) && line.replace(/[\d.,\s]/g, "").length < 3
    ) continue;

    // Good candidate: all caps with reasonable length, or title case
    if (
      (line === line.toUpperCase() && line.length > 3) ||
      (line[0] === line[0].toUpperCase() && line.split(" ").length >= 2)
    ) {
      candidates.push(line);
    }
  }

  // Return first good merchant name
  for (const c of candidates) {
    // Skip if looks like generic text
    if (/^(jalan|jl|jl\.|rt|rw|kec|kel|desa|kota|kab|prov)/i.test(c)) continue;
    return c;
  }

  // Fallback: first reasonable non-empty line
  return lines.find((l) => l.length > 3 && !/^\d/.test(l))?.trim() || undefined;
}
