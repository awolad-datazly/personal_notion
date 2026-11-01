"use client";

import { useEffect, useId, useRef } from "react";

import { useVaultPlayer } from "@/components/vault/player-context";

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise<void>((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };

      if (!document.querySelector("script[data-youtube-api]")) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.dataset.youtubeApi = "true";
        document.body.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

export function YouTubePlayer({ videoId }: { videoId: string }) {
  const hostId = useId().replace(/:/g, "");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const { apiRef } = useVaultPlayer();

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      await loadYouTubeApi();

      if (cancelled || !wrapperRef.current || !window.YT?.Player) {
        return;
      }

      // Destroy previous player instance cleanly
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }

      // Re-create mount target inside persistent wrapper
      wrapperRef.current.innerHTML = "";
      const mountTarget = document.createElement("div");
      mountTarget.id = `yt-${hostId}-${videoId}`;
      mountTarget.className = "w-full h-full";
      wrapperRef.current.appendChild(mountTarget);

      playerRef.current = new window.YT.Player(mountTarget, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            apiRef.current = {
              getCurrentTime: () => event.target.getCurrentTime() || 0,
              seekTo: (seconds) => event.target.seekTo(seconds, true),
            };
          },
        },
      });
    }

    void mount();

    return () => {
      cancelled = true;
      apiRef.current = null;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [apiRef, hostId, videoId]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
      <div ref={wrapperRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
