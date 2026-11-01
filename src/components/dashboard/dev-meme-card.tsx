"use client";

import {
  ArrowUpRight,
  Coffee,
  ExternalLink,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MemeData } from "@/app/api/meme/route";

function formatUps(ups: number) {
  if (ups >= 1000) {
    return `${(ups / 1000).toFixed(1)}k`;
  }
  return String(ups);
}

export function DevMemeCard() {
  const [memes, setMemes] = useState<MemeData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const fetchNextBatch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meme");
      if (res.ok) {
        const data = (await res.json()) as { memes: MemeData[] };
        if (data.memes && data.memes.length > 0) {
          setMemes(data.memes);
          setCurrentIndex(0);
        }
      }
    } catch {
      // Handled by API fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      try {
        const res = await fetch("/api/meme");
        if (!res.ok) return;
        const data = (await res.json()) as { memes: MemeData[] };
        if (!ignore && data.memes && data.memes.length > 0) {
          setMemes(data.memes);
        }
      } catch {
        // fallback
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    void initLoad();
    return () => {
      ignore = true;
    };
  }, []);

  const currentMeme = memes[currentIndex];

  function handleNextMeme() {
    if (memes.length <= 1) {
      void fetchNextBatch();
      return;
    }

    setImgLoaded(false);
    if (currentIndex + 1 >= memes.length) {
      // Re-fetch fresh batch or loop
      setCurrentIndex(0);
      void fetchNextBatch();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  return (
    <>
      <div
        id="coffee-break"
        className="flex flex-col space-y-3 scroll-mt-20"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Coffee className="size-4 text-amber-400/90" />
            <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
              MEME_RADAR // r/ProgrammerHumor
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentMeme ? (
              <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-xs text-zinc-300 border border-zinc-700/50">
                ▲ {formatUps(currentMeme.ups)}
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleNextMeme}
              disabled={loading}
              className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
              title="Next meme (Take a coffee break)"
            >
              <RefreshCw
                className={`size-3 text-zinc-400 ${
                  loading ? "animate-spin text-zinc-200" : ""
                }`}
              />
              <span>Next Meme</span>
            </button>
          </div>
        </div>

        {/* Meme Content Container */}
        <div className="group relative overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 transition-all hover:border-zinc-750">
          {loading && !currentMeme ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-2 animate-pulse font-mono text-xs text-zinc-500">
              <Coffee className="size-6 animate-bounce text-zinc-600" />
              <span>Fetching coffee break meme...</span>
            </div>
          ) : currentMeme ? (
            <div className="flex flex-col space-y-3">
              {/* Meme Title */}
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-zinc-200 leading-snug">
                  {currentMeme.title}
                </p>
                {currentMeme.postLink ? (
                  <a
                    href={currentMeme.postLink}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="View on Reddit"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : null}
              </div>

              {/* Meme Image Preview Container */}
              <div
                className="relative flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/70 p-2 cursor-pointer max-h-[340px] overflow-hidden"
                onClick={() => setLightboxOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentMeme.url}
                  alt={currentMeme.title}
                  onLoad={() => setImgLoaded(true)}
                  className={`max-h-[310px] w-auto max-w-full rounded object-contain mx-auto transition-opacity duration-200 ${
                    imgLoaded ? "opacity-100" : "opacity-40 blur-xs"
                  }`}
                />

                {/* Expand Overlay Button */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 font-mono text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-md">
                  <Maximize2 className="size-3" />
                  <span>Click to Expand</span>
                </div>
              </div>

              {/* Micro footer */}
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-300 px-0.5 pt-0.5">
                <span className="text-zinc-400">u/{currentMeme.author || "developer"}</span>
                <span className="text-zinc-400">Coffee break mode</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Lightbox Dialog */}
      {lightboxOpen && currentMeme ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-4xl flex-col rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="size-4 text-amber-400" />
                <h3 className="line-clamp-1 font-mono text-sm font-semibold text-zinc-200">
                  {currentMeme.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={currentMeme.postLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <span>Reddit</span>
                  <ArrowUpRight className="size-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMeme.url}
                alt={currentMeme.title}
                className="max-h-[75vh] w-auto max-w-full rounded object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
