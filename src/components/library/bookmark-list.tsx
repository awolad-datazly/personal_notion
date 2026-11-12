"use client";

import { ArrowUpRight, Check, Copy, FileText, Terminal, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeBookmarkAction } from "@/app/actions/library";
import { openArticleReader } from "@/components/reader/article-reader-drawer";
import { toast } from "@/components/ui/toast";
import type { LibraryBookmark } from "@/lib/library/present";

type BookmarkFilter = "ALL" | LibraryBookmark["type"];

export function BookmarkList({ items }: { items: LibraryBookmark[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<BookmarkFilter>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered =
    filter === "ALL" ? items : items.filter((item) => item.type === filter);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await removeBookmarkAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Bookmark removed");
      router.refresh();
    });
  }

  async function handleCopy(item: LibraryBookmark) {
    try {
      await navigator.clipboard.writeText(
        item.notes ? `${item.title}\n${item.notes}` : item.title,
      );
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Could not copy that bookmark");
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {[
            { id: "ALL", label: "All Bookmarks" },
            { id: "VIDEO", label: "Videos" },
            { id: "ARTICLE", label: "Articles" },
            { id: "NOTE", label: "Notes" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as BookmarkFilter)}
              className={`h-8 px-3 rounded-md text-xs md:text-[13px] font-medium transition-colors ${
                filter === tab.id
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
          <span>{filtered.length} saved</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center space-y-3">
          <Terminal className="size-8 mx-auto text-zinc-600" />
          <p className="font-mono text-sm font-semibold text-zinc-200">
            No bookmarks yet.
          </p>
          <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
            Save a story from the radar, pin the scratchpad, or bookmark an article from the reader.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 font-mono text-xs">
            <Link
              href="/news"
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              Open News Radar
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col p-4 transition-colors hover:bg-zinc-850/40 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 shrink-0 mt-0.5">
                    {item.type === "VIDEO" ? (
                      <Video className="size-3.5 text-zinc-400" />
                    ) : item.type === "ARTICLE" ? (
                      <FileText className="size-3.5 text-zinc-400" />
                    ) : (
                      <Terminal className="size-3.5 text-zinc-400" />
                    )}
                    {item.type}
                  </span>

                  {item.type === "ARTICLE" ? (
                    <button
                      type="button"
                      onClick={() => openArticleReader(item.url, item.title)}
                      className="line-clamp-2 text-left text-base md:text-[17px] font-semibold text-zinc-100 hover:text-white transition-colors leading-snug"
                    >
                      {item.title}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="line-clamp-2 text-base md:text-[17px] font-semibold text-zinc-100 hover:text-white transition-colors leading-snug"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 shrink-0">
                  <span>{item.date}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(item)}
                    className="size-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Copy note"
                  >
                    {copiedId === item.id ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="size-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  {item.type === "ARTICLE" ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="size-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <ArrowUpRight className="size-4" />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="size-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  )}
                </div>
              </div>

              {item.notes ? (
                <p className="font-mono text-sm md:text-[15px] text-zinc-300 pl-8 leading-relaxed">
                  {item.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
