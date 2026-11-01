"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { NotePad } from "@/components/vault/note-pad";
import { VaultPlayerProvider } from "@/components/vault/player-context";
import { YouTubePlayer } from "@/components/vault/youtube-player";
import type { NoteTimestamp } from "@/db/schema";

export function LearningWorkspace({
  resourceId,
  videoId,
  title,
  initialContent = "",
  initialTimestamps = [],
  updatedAt = null,
  onClose,
}: {
  resourceId?: string;
  videoId: string;
  title: string;
  initialContent?: string;
  initialTimestamps?: NoteTimestamp[];
  updatedAt?: string | null;
  onClose?: () => void;
}) {
  const [leftRatio, setLeftRatio] = useState(0.6);
  const dragging = useRef(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!dragging.current || !shellRef.current) {
      return;
    }

    const rect = shellRef.current.getBoundingClientRect();
    const next = (event.clientX - rect.left) / rect.width;
    setLeftRatio(Math.min(0.72, Math.max(0.38, next)));
  }, []);

  const stopDragging = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [onPointerMove, stopDragging]);

  return (
    <VaultPlayerProvider>
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
              60/40 Split Workspace
            </span>
            <h1 className="text-base sm:text-lg font-semibold text-zinc-100 line-clamp-1">
              {title}
            </h1>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 font-mono text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              ✕ Close Workspace
            </button>
          ) : null}
        </div>

        <div
          ref={shellRef}
          className="flex min-h-[70vh] flex-1 flex-col gap-4 xl:flex-row xl:gap-0"
        >
          <section
            className="min-w-0 xl:pr-3"
            style={{ flex: `0 0 ${leftRatio * 100}%` }}
          >
            <YouTubePlayer videoId={videoId} />
            <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Distraction-free player</span>
              <span>
                Press <kbd className="text-zinc-200">⌘J</kbd> to insert timestamp
              </span>
            </div>
          </section>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize learning panes"
            onPointerDown={() => {
              dragging.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="relative hidden w-3 shrink-0 cursor-col-resize xl:block"
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-800" />
            <span className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900 shadow-sm" />
          </div>

          <section className="flex min-h-[28rem] min-w-0 flex-1 xl:pl-3">
            <div className="min-h-0 w-full flex-1">
              <NotePad
                resourceId={resourceId}
                videoId={videoId}
                videoTitle={title}
                initialContent={initialContent}
                initialTimestamps={initialTimestamps}
                updatedAt={updatedAt}
              />
            </div>
          </section>
        </div>
      </div>
    </VaultPlayerProvider>
  );
}
