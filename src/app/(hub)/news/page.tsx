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
            items={items}
            canManageMustLearn={canManageMustLearn}
            canSummarize={canSummarize}
          />
        </section>

        {/* Right 4 Columns: Tech to Learn Radar */}
        <section className="lg:col-span-4">
          <TechRadarPanel items={items} />
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
