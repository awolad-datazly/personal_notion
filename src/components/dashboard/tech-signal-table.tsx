"use client";

import { ArrowUpRight, Bookmark, BookOpen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { openArticleReader } from "@/components/reader/article-reader-drawer";
import { toast } from "@/components/ui/toast";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks-storage";
import { subscribeToStorage } from "@/lib/storage-bus";

export type SignalItem = {
  id: string;
  source: "HN" | "GH" | "DEV" | "SUB";
  sourceName: string;
  title: string;
  takeaway: string;
  category: string;
  url: string;
  metrics: string;
  time: string;
  createdAt: string;
  imageUrl?: string;
};

const INITIAL_SIGNALS: SignalItem[] = [
  {
    id: "sig-sub-1",
    source: "SUB",
    sourceName: "ByteByteGo",
    title: "EP231: AI Terms You Need to Know (LLM Architecture & Serving)",
    takeaway: "Visual breakdowns of PagedAttention, KV-cache compression, speculative decoding, and mixture-of-experts routing.",
    category: "AI / Architecture",
    url: "https://blog.bytebytego.com/p/ep231-ai-terms-you-need-to-know",
    metrics: "219 likes • 42 comments",
    imageUrl: "https://substackcdn.com/image/fetch/$s_!4n-C!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fcfe11eb9-4763-408f-8292-93c70f52c133_2528x3376.jpeg",
    time: "1h ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sig-1",
    source: "HN",
    sourceName: "Hacker News",
    title: "Understanding Memory Ownership & Zero-Copy in High-Performance Distributed Engines",
    takeaway: "Zero-copy buffers and avoiding kernel context switches doubles query throughput on NVMe drives.",
    category: "Systems",
    url: "https://news.ycombinator.com",
    metrics: "482 pts • 142 comments",
    time: "2h ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sig-2",
    source: "GH",
    sourceName: "GitHub",
    title: "vllm-project/vllm: High-throughput and memory-efficient LLM serving engine with PagedAttention",
    takeaway: "PagedAttention manages attention keys and values with near-zero memory waste, quadrupling throughput.",
    category: "AI",
    url: "https://github.com/vllm-project/vllm",
    metrics: "34.5k ★",
    time: "4h ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sig-3",
    source: "DEV",
    sourceName: "Dev.to",
    title: "Zero-Downtime Database Schema Migrations at Scale: Lessons from 100M Rows",
    takeaway: "Dual-writing, backfilling in chunked batches, and lock-free constraint validation without tail latency spikes.",
    category: "Database",
    url: "https://dev.to/engineering/zero-downtime-postgres-migrations",
    metrics: "340 reactions",
    time: "6h ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sig-4",
    source: "HN",
    sourceName: "Hacker News",
    title: "Inside the V8 Engine: Hidden Classes, Inline Caches & TurboFan Bailouts",
    takeaway: "Why monomorphic call sites run 5x faster than polymorphic sites in high-throughput Node.js microservices.",
    category: "Backend",
    url: "https://v8.dev/blog",
    metrics: "310 pts • 98 comments",
    time: "8h ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sig-5",
    source: "GH",
    sourceName: "GitHub",
    title: "astral-sh/uv: An extremely fast Python package and project manager written in Rust",
    takeaway: "Resolves dependency graphs 10-100x faster than pip using lockfile determinism and global disk caches.",
    category: "Rust / Tooling",
    url: "https://github.com/astral-sh/uv",
    metrics: "42.1k ★",
    time: "11h ago",
    createdAt: new Date().toISOString(),
  },
];

function SignalBookmarkButton({ item }: { item: SignalItem }) {
  const bookmarked = useSyncExternalStore(
    subscribeToStorage,
    () => isBookmarked(item.url),
    () => false,
  );

  return (
    <button
      type="button"
      onClick={() => {
        const next = toggleBookmark({
          id: item.url,
          title: item.title,
          url: item.url,
          source: item.sourceName,
          summary: item.takeaway,
          tags: [item.category],
        });
        toast.success(next ? "Saved to Bookmarks" : "Removed from Bookmarks");
      }}
      className={`flex h-9 items-center justify-center rounded-md border border-zinc-700/70 bg-zinc-800 px-2.5 text-sm transition-colors shadow-xs active:scale-[0.98] ${
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

export function TechSignalTable() {
  const [signals, setSignals] = useState<SignalItem[]>(INITIAL_SIGNALS);
  const [filter, setFilter] = useState<"ALL" | "HN" | "GH" | "DEV" | "SUB">("ALL");
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const fetchSignals = useCallback(async (isManual = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals");
      if (!res.ok) throw new Error("Failed to fetch live signals");
      const data = await res.json();
      if (data.signals && data.signals.length > 0) {
        setSignals(data.signals);
        setIsLive(data.isLive ?? true);
        if (isManual) {
          toast.success("Tech signal feed refreshed from live APIs");
        }
      }
    } catch {
      if (isManual) {
        toast.info("Using cached technical signals");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      try {
        const res = await fetch("/api/signals");
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && data.signals && data.signals.length > 0) {
          setSignals(data.signals);
          setIsLive(data.isLive ?? true);
        }
      } catch {
        // ignore init failure
      }
    }
    initLoad();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered =
    filter === "ALL"
      ? signals
      : signals.filter((item) => item.source === filter);

  return (
    <div className="flex flex-col space-y-3">
      {/* Table Header / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
            Tech Signal Feed
          </span>
          <span className="flex items-center gap-1.5 rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-xs text-zinc-300 border border-zinc-700/50">
            {isLive ? (
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : null}
            <span>{filtered.length} Live</span>
          </span>

          <button
            type="button"
            onClick={() => fetchSignals(true)}
            disabled={loading}
            className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
            title="Refresh feed"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin text-zinc-200" : ""}`} />
            <span className="hidden sm:inline">
              {loading
                ? "Fetching signals… avoiding node_modules…"
                : "Refresh"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          {(["ALL", "HN", "GH", "DEV", "SUB"] as const).map((tab) => (
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

      {/* Scannable High-Density List */}
      <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group relative flex items-start justify-between gap-3 sm:gap-4 p-4 transition-colors hover:bg-zinc-850/40"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start gap-2.5">
                <span
                  className={`font-mono text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded border shrink-0 mt-0.5 ${
                    item.source === "SUB"
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                      : item.source === "DEV"
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                      : item.source === "HN"
                      ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                      : "bg-zinc-800/90 text-zinc-200 border-zinc-700/60"
                  }`}
                >
                  {item.source}
                </span>

                <button
                  type="button"
                  onClick={() => openArticleReader(item.url, item.title)}
                  className="text-left line-clamp-2 text-base md:text-[17px] font-semibold text-zinc-100 hover:text-white transition-colors leading-snug cursor-pointer"
                >
                  {item.title}
                </button>
              </div>

              <p className="text-sm md:text-[15px] text-zinc-300 leading-relaxed pl-10 line-clamp-2 sm:line-clamp-3">
                {item.takeaway}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 pl-10 text-xs font-mono text-zinc-400">
                <span className="rounded bg-zinc-800/70 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-750">
                  {item.category}
                </span>
                <span>•</span>
                <span>{item.metrics}</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>

            {/* Right Side: Cover Image Thumbnail (if present) + Actions */}
            <div className="flex items-start gap-2.5 sm:gap-3 shrink-0">
              {item.imageUrl ? (
                <button
                  type="button"
                  onClick={() => openArticleReader(item.url, item.title)}
                  className="relative shrink-0 w-20 h-16 sm:w-28 sm:h-20 md:w-32 md:h-22 rounded-lg overflow-hidden border border-zinc-800/90 bg-zinc-950 group-hover:border-zinc-700 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  title="Open in Reader"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ) : null}

              {/* Hover Actions */}
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
          </div>
        ))}
      </div>
    </div>
  );
}
