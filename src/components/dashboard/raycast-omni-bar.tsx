"use client";

import { ArrowRight, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { openArticleReader } from "@/components/reader/article-reader-drawer";
import { toast } from "@/components/ui/toast";
import { extractYouTubeId } from "@/lib/youtube";
import { saveStudySession } from "@/lib/study-storage";

const QUICK_ACTIONS = [
  {
    label: "Go & gRPC Microservices (YouTube)",
    url: "https://www.youtube.com/watch?v=kYv_8w4-f-M",
    type: "video",
  },
  {
    label: "Next.js 16 Deep Dive (YouTube)",
    url: "https://www.youtube.com/watch?v=T_8N_b37Q6M",
    type: "video",
  },
  {
    label: "PostgreSQL 100M Rows Migration (Blog)",
    url: "https://dev.to/tech/zero-downtime-database-migrations-at-scale",
    type: "article",
  },
];

export function RaycastOmniBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleExecute(targetUrl?: string) {
    const raw = (targetUrl ?? query).trim();
    if (!raw) {
      setError("Enter a YouTube URL or technical blog link to inspect");
      return;
    }

    setError(null);
    const ytId = extractYouTubeId(raw);

    if (ytId) {
      toast.success("Launching Study Workspace...");
      // Pre-save session so it is immediately visible in study sessions
      let resolvedTitle = "YouTube Study Session";
      const matchedAction = QUICK_ACTIONS.find((a) => a.url.includes(ytId));
      if (matchedAction) {
        resolvedTitle = matchedAction.label.replace(/\s*\(YouTube\)$/, "");
      }

      saveStudySession({
        videoId: ytId,
        title: resolvedTitle,
      });

      startTransition(() => {
        router.push(`/vault?watch=${encodeURIComponent(ytId)}`);
      });

      // Try fetching official oEmbed title in background to enrich metadata
      fetch(`/api/youtube?id=${ytId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.title) {
            saveStudySession({
              videoId: ytId,
              title: data.title,
            });
          }
        })
        .catch(() => {});
      return;
    }

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      toast.info("Opening Article Reader...");
      openArticleReader(raw);
      return;
    }

    // Default: search filter
    startTransition(() => {
      router.push(`/radar?search=${encodeURIComponent(raw)}`);
    });
  }

  return (
    <div className="w-full space-y-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
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
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste YouTube tutorial, technical blog URL, or search..."
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
            <span>{isPending ? "Resolving reality…" : "Open"}</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      {error ? (
        <p className="font-mono text-xs text-red-400 pl-1">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-1 text-xs font-mono text-zinc-300">
        <span className="text-zinc-400">Quick load:</span>
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
