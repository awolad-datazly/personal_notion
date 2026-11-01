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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const { apiRef } = useVaultPlayer();

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      await loadYouTubeApi();

      if (cancelled || !containerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(containerRef.current, {
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
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [apiRef, videoId]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
      <div id={hostId} ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
