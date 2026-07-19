"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, X } from "lucide-react";
import { useAiQuery } from "@/hooks/useAiQuery";

const SUGGESTIONS = [
  "Total pengeluaran bulan ini?",
  "Kategori apa yang paling besar?",
  "Total tagihan Apple 3 bulan terakhir?",
  "Berapa rata-rata pengeluaran per hari?",
];

export default function AiQuery() {
  const { answer, isLoading, error, ask, reset } = useAiQuery();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    ask(input);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    ask(suggestion);
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {/* Query panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                AI Asisten
              </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 min-h-[120px] max-h-[320px] overflow-y-auto">
              {/* Suggestions */}
              {!answer && !error && !isLoading && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Coba tanya:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSuggestion(s)}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Menganalisis data...</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                  <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}

              {/* Answer */}
              {answer && (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {answer}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya sesuatu..."
                className="flex-1 h-8 text-xs bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
