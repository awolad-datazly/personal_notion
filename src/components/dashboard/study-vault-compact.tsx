"use client";

import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { useSyncExternalStore } from "react";
import { DEFAULT_SESSIONS, getStudySessions } from "@/lib/study-storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function StudyVaultCompact() {
  const sessions = useSyncExternalStore(subscribe, getStudySessions, () => DEFAULT_SESSIONS);

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
          Continue Studying
        </span>
        <Link
          href="/vault"
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
        >
          <span>Vault</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 divide-y divide-zinc-800/60 overflow-hidden">
        {sessions.slice(0, 3).map((study) => (
          <div
            key={study.id}
            className="group flex flex-col gap-3 p-4 transition-colors hover:bg-zinc-850/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  href={`/vault?watch=${encodeURIComponent(study.videoId)}`}
                  className="block line-clamp-2 text-base md:text-[17px] font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug"
                >
                  {study.title}
                </Link>
                <p className="font-mono text-sm text-zinc-300">
                  {study.channel}
                </p>
              </div>

              <Link
                href={`/vault?watch=${encodeURIComponent(study.videoId)}`}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-zinc-100 px-3.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-white shadow-xs active:scale-[0.98]"
              >
                <Play className="size-3.5 fill-current" />
                <span>Resume</span>
              </Link>
            </div>

            {/* Progress bar and timestamp indicator */}
            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-200 rounded-full transition-all"
                  style={{ width: `${study.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
                <span>{study.timestampsCount} timestamp notes</span>
                <span>Position: {study.lastPosition}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
