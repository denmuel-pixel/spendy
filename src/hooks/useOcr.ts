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
      workerRef.current = Tesseract.createWorker("eng", 1, {
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
  // Find all amounts with Rp/IDR prefix or "total" label
  const allAmounts: number[] = [];
  
  // Pattern 1: "Total/Rp/IDR: Rp 50.000" or "Rp50.000"
  const pattern1 = /(?:total|jumlah|rp|idr)\s*:?\s*(?:rp\s*)?([\d.,]+)/gi;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const cleaned = match[1].replace(/\./g, "").replace(",", ".");
    const amount = parseFloat(cleaned);
    if (!isNaN(amount) && amount > 0) {
      allAmounts.push(amount);
    }
  }

  // Pattern 2: Any number with Rp prefix
  const pattern2 = /rp\s*([\d.,]+)/gi;
  while ((match = pattern2.exec(text)) !== null) {
    const cleaned = match[1].replace(/\./g, "").replace(",", ".");
    const amount = parseFloat(cleaned);
    if (!isNaN(amount) && amount > 0) {
      allAmounts.push(amount);
    }
  }

  // Return the largest amount found (usually the total)
  if (allAmounts.length > 0) {
    return Math.max(...allAmounts);
  }
  return undefined;
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
  // Filter lines that look like merchant/store names (all caps, not starting with number)
  const lines = text.split("\n").filter((l) => {
    const t = l.trim();
    return (
      t.length > 2 &&
      t.length < 80 &&
      !t.match(/^\d/) &&
      !t.includes(":") &&
      !t.includes("Rp") &&
      !t.includes("tax") &&
      !t.includes("total") &&
      !t.includes("item")
    );
  });
  
  // Return the first reasonable-looking merchant name
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 3 && trimmed.length < 60) {
      return trimmed;
    }
  }
  
  // Fallback: first non-empty line
  return text.split("\n").find((l) => l.trim().length > 0)?.trim() || undefined;
}
