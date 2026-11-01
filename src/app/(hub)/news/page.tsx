import { Suspense } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";
import { NewsFeed } from "@/components/news/news-feed";
import { RefreshFeedButton } from "@/components/news/refresh-feed-button";
import { TechRadarPanel } from "@/components/news/tech-radar-panel";
import { hasDatabaseUrl } from "@/db";
import type { TechNewsItem } from "@/db/schema";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { listTechNews } from "@/lib/news/data";

const FALLBACK_NEWS_ITEMS: TechNewsItem[] = [
  {
    id: "hn-1",
    title: "SQLite in 2026: Fast, Robust, and Now Supporting Vector Indexes",
    url: "https://news.ycombinator.com",
    category: "Databases",
    summary: "Native diskANN integration enables millisecond vector similarity queries without Postgres extensions.",
    isMustLearn: true,
    createdAt: new Date(),
  },
  {
    id: "gh-2",
    title: "Rust 2026 Edition: Async Closures and Ergonomic Lifetime Simplification",
    url: "https://github.com",
    category: "Rust / Systems",
    summary: "Major improvements in borrow checker diagnostics and native async trait stabilization.",
    isMustLearn: true,
    createdAt: new Date(),
  },
  {
    id: "dev-3",
    title: "Building Zero-Latency Offline-First Workspaces with CRDTs",
    url: "https://dev.to",
    category: "Architecture",
    summary: "How Yjs and local IndexedDB caching yield instant 60fps desktop UX without cloud roundtrips.",
    isMustLearn: false,
    createdAt: new Date(),
  },
  {
    id: "ai-4",
    title: "Gemini 2.5 Flash Thinking: Sub-Second Reasoning at 10x Lower Token Costs",
    url: "https://ai.google.dev",
    category: "AI / LLM",
    summary: "Chain-of-thought distillation enables complex code analysis directly in browser dev tools.",
    isMustLearn: true,
    createdAt: new Date(),
  },
  {
    id: "v8-5",
    title: "Inside the V8 Engine: Hidden Classes, Inline Caches & TurboFan Optimizations",
    url: "https://v8.dev/blog",
    category: "Engineering",
    summary: "Why monomorphic call sites run 5x faster in high-throughput Node.js microservices.",
    isMustLearn: false,
    createdAt: new Date(),
  },
];

function NewsFeedSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3 animate-pulse">
      <div className="h-6 w-36 rounded bg-zinc-800" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded border border-zinc-800/60 bg-zinc-950/40" />
        ))}
      </div>
    </div>
  );
}

async function DynamicNewsContent() {
  await connection();

  const session = await auth();
  const role = session?.user.role ?? null;
  const canSummarize = await isFeatureEnabled("ai_summarizer", { role });
  const canManageMustLearn = role === "ADMIN";
  const canRefresh = role === "ADMIN";

  let items: TechNewsItem[] = [];
  if (hasDatabaseUrl()) {
    try {
      items = await listTechNews("all");
    } catch {
      items = [];
    }
  }

  const displayItems = items.length > 0 ? items : FALLBACK_NEWS_ITEMS;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Utility Row */}
      {canRefresh ? (
        <div className="flex items-center justify-end">
          <RefreshFeedButton />
        </div>
      ) : null}

      {/* 2-Column High-Density Asymmetric Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Columns: Live Tech Signal Feed */}
        <section className="lg:col-span-8">
          <NewsFeed
            items={displayItems}
            canManageMustLearn={canManageMustLearn}
            canSummarize={canSummarize}
          />
        </section>

        {/* Right 4 Columns: Tech to Learn Radar */}
        <section className="lg:col-span-4">
          <TechRadarPanel />
        </section>
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-7 px-8 py-7">
      <Suspense fallback={<NewsFeedSkeleton />}>
        <DynamicNewsContent />
      </Suspense>
    </main>
  );
}
