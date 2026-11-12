"use client";

import { ArrowRight, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { captureLinkAction } from "@/app/actions/library";
import { openArticleReader } from "@/components/reader/article-reader-drawer";
import { toast } from "@/components/ui/toast";

const QUICK_ACTIONS = [
  {
    label: "Go & gRPC Microservices (YouTube)",
    url: "https://www.youtube.com/watch?v=kYv_8w4-f-M",
  },
  {
    label: "Next.js 16 Deep Dive (YouTube)",
    url: "https://www.youtube.com/watch?v=T_8N_b37Q6M",
  },
  {
    label: "PostgreSQL migrations (Blog)",
    url: "https://dev.to/tech/zero-downtime-database-migrations-at-scale",
  },
];

export function RaycastOmniBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExecute(targetUrl?: string) {
    const raw = (targetUrl ?? query).trim();
    if (!raw) {
      setError("Paste a YouTube URL or an article link");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await captureLinkAction(raw);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      if (result.kind === "youtube") {
        toast.success("Saved to your vault");
        router.push(result.href);
        return;
      }

      toast.success("Saved to your reader");
      openArticleReader(result.url);
      setQuery("");
      router.refresh();
    });
  }

  return (
    <div className="w-full space-y-2.5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleExecute();
        }}
        className="group relative flex h-12 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 shadow-sm transition-colors focus-within:border-zinc-600"
      >
        <span className="font-mono text-sm font-semibold text-zinc-400 select-none mr-3">
          &gt;
        </span>
        <input
          id="omni-input"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste a YouTube tutorial or technical article URL..."
          className="h-full flex-1 bg-transparent font-mono text-base text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
        />

        <div className="flex items-center gap-2 shrink-0">
          <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-700/60 bg-zinc-800/80 px-2 py-1 font-mono text-xs text-zinc-300">
            <CornerDownLeft className="size-3 mr-1 text-zinc-400" />
            Enter
          </kbd>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-9 items-center gap-1.5 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            <span>{isPending ? "Saving…" : "Open"}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      {error ? (
        <p className="font-mono text-xs text-red-400 pl-1">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-1 text-xs font-mono text-zinc-300">
        <span className="text-zinc-400">Save:</span>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              setQuery(action.url);
              handleExecute(action.url);
            }}
            className="text-zinc-300 hover:text-white underline-offset-4 hover:underline transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
