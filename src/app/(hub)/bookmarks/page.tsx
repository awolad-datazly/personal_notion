"use client";

import { ArrowUpRight, Check, Copy, FileText, Terminal, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type BookmarkType = "ALL" | "VIDEO" | "ARTICLE" | "NOTE";

type BookmarkItem = {
  id: string;
  type: "VIDEO" | "ARTICLE" | "NOTE";
  title: string;
  source: string;
  date: string;
  notes: string;
  url: string;
};

const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: "bm-1",
    type: "VIDEO",
    title: "Rust Ownership, Lifetimes, and Zero-Copy I/O Notes",
    source: "YouTube • 3 timestamps",
    date: "Oct 28, 2026",
    notes: "std::io buffer reuse across worker threads without atomic locks; pinned memory with pin-project crate.",
    url: "/vault",
  },
  {
    id: "bm-2",
    type: "ARTICLE",
    title: "The Anatomy of a Production Distributed LSM Storage Engine",
    source: "Hacker News Signal",
    date: "Oct 25, 2026",
    notes: "MemTable write stalls, Bloom filter false-positive curve tuning, and read-amplification tradeoffs in RocksDB.",
    url: "/articles",
  },
  {
    id: "bm-3",
    type: "VIDEO",
    title: "Next.js 16 Partial Prerendering: Instant Static Shells & Streaming Dynamics",
    source: "YouTube • 4 timestamps",
    date: "Oct 22, 2026",
    notes: "Cache tag invalidation rules in App Router; wrapping un-cached headers() / cookies() in Suspense boundaries.",
    url: "/vault",
  },
  {
    id: "bm-4",
    type: "NOTE",
    title: "Consensus Protocols Cheat Sheet: Raft vs PBFT vs Paxos",
    source: "Scratchpad Save",
    date: "Oct 19, 2026",
    notes: "Raft leader election safety invariant: a candidate must have an up-to-date log compared to quorum to win votes.",
    url: "/#scratchpad",
  },
];

export function BookmarksContent() {
  const [filter, setFilter] = useState<BookmarkType>("ALL");
  const [bookmarks, setBookmarks] = useState(INITIAL_BOOKMARKS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered =
    filter === "ALL"
      ? bookmarks
      : bookmarks.filter((item) => item.type === filter);

  function handleDelete(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleCopy(item: BookmarkItem) {
    try {
      await navigator.clipboard.writeText(`${item.title}\n${item.notes}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard error
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {[
            { id: "ALL", label: "All Bookmarks" },
            { id: "VIDEO", label: "Video Timestamps" },
            { id: "ARTICLE", label: "Article Reads" },
            { id: "NOTE", label: "Scratchpad Notes" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as BookmarkType)}
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
          <span>{filtered.length} Indexed</span>
          <span>•</span>
          <span>Offline Ready</span>
        </div>
      </div>

      {/* 2. Dense Scannable List */}
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

                <Link
                  href={item.url}
                  className="line-clamp-2 text-base md:text-[17px] font-semibold text-zinc-100 hover:text-white transition-colors leading-snug"
                >
                  {item.title}
                </Link>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 shrink-0">
                <span>{item.date}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(item)}
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
                  title="Delete bookmark"
                >
                  <Trash2 className="size-4" />
                </button>
                <Link
                  href={item.url}
                  className="size-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>

            <p className="font-mono text-sm md:text-[15px] text-zinc-300 pl-8 leading-relaxed">
              {item.notes}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-7">
      <BookmarksContent />
    </main>
  );
}
