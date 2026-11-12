"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { captureLinkAction } from "@/app/actions/library";
import { openArticleReader } from "@/components/reader/article-reader-drawer";
import { toast } from "@/components/ui/toast";
import type { ArticleRecord } from "@/lib/library/present";

export function ArticleLibrary({
  articles,
  initialReadUrl,
  signedIn,
}: {
  articles: ArticleRecord[];
  initialReadUrl?: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialReadUrl) {
      openArticleReader(initialReadUrl);
    }
  }, [initialReadUrl]);

  function openSaved(article: ArticleRecord) {
    startTransition(async () => {
      const result = await captureLinkAction(article.url);
      if ("error" in result) {
        toast.error(result.error);
        openArticleReader(article.url, article.title);
        return;
      }
      if (result.kind === "youtube") {
        router.push(result.href);
        return;
      }
      openArticleReader(result.url, article.title);
      router.refresh();
    });
  }

  function handleReadSubmit(event: React.FormEvent) {
    event.preventDefault();
    const raw = urlInput.trim();
    if (!raw) {
      setError("Paste an article URL");
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
        router.push(result.href);
        return;
      }
      openArticleReader(result.url);
      setUrlInput("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleReadSubmit}
        className="flex h-12 w-full items-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-4 transition-colors focus-within:border-zinc-600 shadow-sm"
      >
        <span className="font-mono text-sm font-semibold text-zinc-400 mr-3">&gt;</span>
        <input
          value={urlInput}
          onChange={(event) => {
            setUrlInput(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste a technical article URL to save and read..."
          className="h-full flex-1 bg-transparent font-mono text-base text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-9 items-center gap-1.5 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-white shrink-0 shadow-xs disabled:opacity-50"
        >
          <span>{pending ? "Saving…" : "Read"}</span>
          <ArrowRight className="size-4" />
        </button>
      </form>
      {error ? <p className="font-mono text-xs text-red-400">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <span className="h-8 flex items-center rounded-md bg-zinc-100 px-3 text-xs md:text-[13px] font-semibold text-zinc-950 shadow-xs font-mono">
          Reading Queue
        </span>
        <span className="font-mono text-xs text-zinc-400">
          {signedIn ? `${articles.length} saved` : "Sign in to keep a reading queue"}
        </span>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center space-y-2">
          <p className="font-mono text-sm font-semibold text-zinc-200">
            No articles saved yet.
          </p>
          <p className="font-mono text-xs text-zinc-400">
            Paste a link above. The reader extracts the page and keeps it in your library.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
          {articles.map((article) => (
            <div
              key={article.id}
              className="group flex items-start justify-between gap-4 p-4 transition-colors hover:bg-zinc-850/40"
            >
              <button
                type="button"
                onClick={() => openSaved(article)}
                className="min-w-0 flex-1 text-left space-y-1.5"
              >
                <p className="font-mono text-xs text-zinc-400">
                  {article.domain ?? "Article"} · {article.createdAt.slice(0, 10)}
                </p>
                <h3 className="text-base md:text-[17px] font-semibold leading-snug text-zinc-100 group-hover:text-white line-clamp-2">
                  {article.title}
                </h3>
                {article.summary ? (
                  <p className="font-mono text-sm text-zinc-400 line-clamp-2">
                    {article.summary}
                  </p>
                ) : (
                  <p className="font-mono text-xs text-zinc-500">
                    Open to extract the article.
                  </p>
                )}
              </button>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
                title="Open original"
              >
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
