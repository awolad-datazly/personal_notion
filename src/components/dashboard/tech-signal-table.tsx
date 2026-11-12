"use client";

import { ArrowUpRight, Bookmark, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { toggleBookmarkAction } from "@/app/actions/library";
import { RefreshFeedButton } from "@/components/news/refresh-feed-button";
import { openArticleReader } from "@/components/reader/article-reader-drawer";
import { toast } from "@/components/ui/toast";
import {
  formatRelativeTime,
  signalBucket,
  type SignalBucket,
} from "@/lib/library/present";

export type RadarSignal = {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  category: string | null;
  createdAt: string;
  bookmarked: boolean;
};

const FILTERS = ["ALL", "HN", "GH", "DEV", "SUB"] as const;

function sourceClass(source: SignalBucket) {
  if (source === "SUB") {
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  }
  if (source === "DEV") {
    return "bg-emerald-950/40 text-emerald-400 border-emerald-500/30";
  }
  if (source === "HN") {
    return "bg-amber-950/40 text-amber-400 border-amber-500/30";
  }
  return "bg-zinc-800/90 text-zinc-200 border-zinc-700/60";
}

function SignalBookmarkButton({ item }: { item: RadarSignal }) {
  const [bookmarked, setBookmarked] = useState(item.bookmarked);
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void toggleBookmarkAction({
          url: item.url,
          title: item.title,
          summary: item.summary ?? "",
        })
          .then((result) => {
            if (result.error || result.bookmarked === undefined) {
              toast.error(result.error ?? "Could not update that bookmark");
              return;
            }
            setBookmarked(result.bookmarked);
            toast.success(
              result.bookmarked ? "Saved to Bookmarks" : "Removed from Bookmarks",
            );
          })
          .finally(() => setPending(false));
      }}
      className={`flex h-9 items-center justify-center rounded-md border border-zinc-700/70 bg-zinc-800 px-2.5 text-sm transition-colors shadow-xs active:scale-[0.98] disabled:opacity-50 ${
        bookmarked
          ? "text-amber-400 border-amber-500/40"
          : "text-zinc-400 hover:text-white hover:bg-zinc-700"
      }`}
      title={bookmarked ? "Remove from Bookmarks" : "Save to Bookmarks"}
    >
      <Bookmark className={`size-4 ${bookmarked ? "fill-current" : ""}`} />
    </button>
  );
}

export function TechSignalTable({
  items,
  canRefresh,
}: {
  items: RadarSignal[];
  canRefresh: boolean;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const filtered =
    filter === "ALL"
      ? items
      : items.filter((item) => signalBucket(item) === filter);

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
            Tech Signal Feed
          </span>
          <span className="flex items-center gap-1.5 rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-xs text-zinc-300 border border-zinc-700/50">
            <span>{filtered.length} stored</span>
          </span>
          {canRefresh ? <RefreshFeedButton /> : null}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`h-8 px-3 rounded-md transition-colors font-medium text-xs md:text-[13px] active:scale-[0.98] ${
                filter === tab
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              {tab === "SUB" ? "Substack" : tab}
            </button>
          ))}
          <Link
            href="/news"
            className="ml-2 h-8 px-3 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <span>Full Radar</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="font-mono text-sm text-zinc-300">
            {items.length === 0
              ? "The radar is empty. Refresh News Radar to pull stories into the library."
              : "No stories in this source."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
          {filtered.map((item) => {
            const source = signalBucket(item);
            return (
              <div
                key={item.id}
                className="group relative flex items-start justify-between gap-3 sm:gap-4 p-4 transition-colors hover:bg-zinc-850/40"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`font-mono text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded border shrink-0 mt-0.5 ${sourceClass(source)}`}
                    >
                      {source}
                    </span>
                    <button
                      type="button"
                      onClick={() => openArticleReader(item.url, item.title)}
                      className="text-left line-clamp-2 text-base md:text-[17px] font-semibold text-zinc-100 hover:text-white transition-colors leading-snug cursor-pointer"
                    >
                      {item.title}
                    </button>
                  </div>

                  {item.summary ? (
                    <p className="text-sm md:text-[15px] text-zinc-300 leading-relaxed pl-10 line-clamp-2 sm:line-clamp-3">
                      {item.summary}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2.5 pt-0.5 pl-10 text-xs font-mono text-zinc-400">
                    {item.category ? (
                      <span className="rounded bg-zinc-800/70 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-750">
                        {item.category}
                      </span>
                    ) : null}
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                  <SignalBookmarkButton item={item} />
                  <button
                    type="button"
                    onClick={() => openArticleReader(item.url, item.title)}
                    className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-700/70 bg-zinc-800 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-xs active:scale-[0.98]"
                    title="Read in Slide-Over Drawer"
                  >
                    <BookOpen className="size-4 text-zinc-400" />
                    <span>Read</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 items-center gap-1 rounded-md border border-zinc-700/70 bg-zinc-800 px-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors shadow-xs"
                    title="Open original website"
                  >
                    <ArrowUpRight className="size-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
