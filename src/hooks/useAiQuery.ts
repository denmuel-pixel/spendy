"use client";

import { useState } from "react";

export function useAiQuery() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses");
      }

      setAnswer(data.jawaban);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setAnswer(null);
    setError(null);
  };

  return { answer, isLoading, error, ask, reset };
}
