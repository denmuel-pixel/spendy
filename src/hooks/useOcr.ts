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
  const patterns = [
    /(?:total|jumlah|rp|idr)\s*:?\s*(?:rp\s*)?([\d.,]+)/gi,
    /(?:rp|idr)\s*([\d.,]+)/gi,
    /([\d.,]+)\s*(?:rp|idr)/gi,
  ];

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length > 0) {
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

function extractMerchant(text: string): string | undefined {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines[0]?.trim() || undefined;
}
