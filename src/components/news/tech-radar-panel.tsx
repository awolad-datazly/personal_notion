import { ArrowUpRight } from "lucide-react";

import type { TechNewsItem } from "@/db/schema";

export function TechRadarPanel({ items }: { items: TechNewsItem[] }) {
  const mustLearn = items.filter((item) => item.isMustLearn);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
          Must Learn
        </span>
        <span className="font-mono text-xs text-zinc-400">
          {mustLearn.length} saved
        </span>
      </div>

      {mustLearn.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-4">
          <p className="font-mono text-sm text-zinc-300">
            No stories are marked Must Learn yet.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
          {mustLearn.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block p-4 transition-colors hover:bg-zinc-850/40"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm md:text-[15px] font-medium text-zinc-100 leading-snug">
                  {item.title}
                </p>
                <ArrowUpRight className="size-3.5 shrink-0 text-zinc-400" />
              </div>
              {item.summary ? (
                <p className="mt-1 font-mono text-xs text-zinc-400 line-clamp-2">
                  {item.summary}
                </p>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
