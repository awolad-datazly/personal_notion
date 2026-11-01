"use client";

import { ArrowUpRight, Check, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { toggleMustLearnAction } from "@/app/actions/news";
import { SummarizeButton } from "@/components/news/summarize-button";
import type { TechNewsItem } from "@/db/schema";

export function NewsFeed({
  items,
  canManageMustLearn,
  canSummarize,
}: {
  items: TechNewsItem[];
  canManageMustLearn: boolean;
  canSummarize: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState<"all" | "must-learn" | "hn" | "gh" | "dev">("all");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (filter === "must-learn") return item.isMustLearn;
      if (filter === "hn") return item.category?.toLowerCase().includes("hacker") || item.url.includes("ycombinator");
      if (filter === "gh") return item.category?.toLowerCase().includes("github") || item.url.includes("github");
      if (filter === "dev") return item.category?.toLowerCase().includes("dev") || item.url.includes("dev.to");
      return true;
    });
  }, [filter, items]);

  const safeIndex =
    visible.length === 0 ? 0 : Math.min(activeIndex, visible.length - 1);

  function toggleExpand(id: string) {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(visible.length - 1, current + 1));
      }

      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(0, current - 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible.length]);

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {[
            { id: "all", label: "All Signals" },
            { id: "must-learn", label: "Must Learn" },
            { id: "hn", label: "HN" },
            { id: "gh", label: "GitHub" },
            { id: "dev", label: "Dev.to" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id as typeof filter);
                setActiveIndex(0);
              }}
              className={`h-8 px-3 rounded-md text-xs md:text-[13px] font-medium transition-colors ${
                filter === tab.id
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
          <span>{visible.length} items</span>
          <span>•</span>
          <span className="hidden sm:inline">J / K to navigate</span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-8 text-center">
          <p className="font-mono text-sm text-zinc-400">No stories matching filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60">
          {visible.map((item, index) => {
            const active = index === safeIndex;
            const isExpanded = expandedItems[item.id] ?? false;

            return (
              <div
                key={item.id}
                id={`news-item-${index}`}
                onMouseEnter={() => setActiveIndex(index)}
                className={`group flex flex-col p-4 transition-colors ${
                  active ? "bg-zinc-850/50" : "hover:bg-zinc-850/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-zinc-700/60 bg-zinc-800/90 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-200 uppercase shrink-0">
                        {item.category ?? "FEED"}
                      </span>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-2 text-base md:text-[17px] font-semibold text-zinc-100 hover:text-white transition-colors leading-snug"
                      >
                        {item.title}
                      </a>

                      {item.isMustLearn ? (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-medium text-emerald-400 shrink-0">
                          Must Learn
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-sm text-zinc-400">
                      <span className="line-clamp-1">{item.url}</span>
                    </div>
                  </div>

                  {/* Actions on row */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {item.summary ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-700/70 bg-zinc-800/90 px-3.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-xs"
                      >
                        <Terminal className="size-4 text-zinc-400" />
                        <span>TL;DR</span>
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                    ) : null}

                    {canManageMustLearn ? (
                      <form
                        action={toggleMustLearnAction.bind(
                          null,
                          item.id,
                          !item.isMustLearn,
                        )}
                      >
                        <button
                          type="submit"
                          className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-700/70 bg-zinc-800/90 px-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors shadow-xs"
                        >
                          <Check className={`size-4 ${item.isMustLearn ? "text-emerald-400" : ""}`} />
                          <span>{item.isMustLearn ? "Saved" : "Save"}</span>
                        </button>
                      </form>
                    ) : null}

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-700/70 bg-zinc-800/90 px-3.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-xs"
                    >
                      <span>Read</span>
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                </div>

                {/* Inline Drawer for TL;DR / Summary */}
                {item.summary && isExpanded ? (
                  <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/90 p-4 font-mono text-sm md:text-[15px] leading-relaxed text-zinc-200">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                      <Terminal className="size-3.5 text-zinc-400" />
                      <span>TL;DR Digest:</span>
                    </div>
                    {item.summary}
                  </div>
                ) : null}

                {/* Summarize button if no summary yet */}
                {!item.summary && canSummarize ? (
                  <div className="mt-2.5">
                    <SummarizeButton newsId={item.id} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
