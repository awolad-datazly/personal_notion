"use client";

import { Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { geminiAuthHeaders, readGeminiKey } from "@/lib/gemini-key";

export function SummarizeButton({
  newsId,
  disabled = false,
}: {
  newsId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSummarize() {
    setError(null);

    const apiKey = readGeminiKey();
    if (!apiKey) {
      toast.info("Please set your Gemini API key in the header to summarize articles.");
      window.dispatchEvent(new CustomEvent("devpulse.open-byok"));
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...geminiAuthHeaders(apiKey),
          },
          body: JSON.stringify({
            newsId,
            persist: true,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          summary?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Summarization failed.");
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Summarization failed.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={handleSummarize}
        className="flex h-9 items-center gap-2 rounded-md border border-zinc-700/70 bg-zinc-800/90 px-3.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 shadow-xs"
      >
        <Terminal className="size-4 text-zinc-400" />
        <span>{isPending ? "Asking AI to read docs…" : "TL;DR Digest"}</span>
      </button>
      {isPending ? <Skeleton className="h-16 w-full rounded-md bg-zinc-800/40" /> : null}
      {error ? <p className="font-mono text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
