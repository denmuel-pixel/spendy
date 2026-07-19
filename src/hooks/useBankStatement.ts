"use client";

import { useState, useCallback } from "react";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
  balance: number;
  categoryId: string;
  merchant: string;
  suggestedCategory: string;
}

interface ParseResult {
  success: boolean;
  bankType: string;
  total: number;
  transactions: ParsedTransaction[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: { index: number; error: string }[];
  transactions?: { id: string; amount: number; merchant: string; date: string }[];
}

export function useBankStatement() {
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsePdf = useCallback(async (file: File, bankType: string) => {
    setIsParsing(true);
    setError(null);
    setParseResult(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bankType", bankType);

      const res = await fetch("/api/bank-statement/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal parsing bank statement");
      }

      setParseResult(data);
      return data as ParseResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal parsing";
      setError(msg);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  const importTransactions = useCallback(
    async (transactions: ParsedTransaction[]) => {
      setIsImporting(true);
      setError(null);

      try {
        const res = await fetch("/api/bank-statement/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal import transaksi");
        }

        setImportResult(data);
        return data as ImportResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal import";
        setError(msg);
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setParseResult(null);
    setImportResult(null);
    setError(null);
  }, []);

  return {
    isParsing,
    isImporting,
    parseResult,
    importResult,
    error,
    parsePdf,
    importTransactions,
    reset,
  };
}
