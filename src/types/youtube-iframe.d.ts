export {};

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    interface PlayerOptions {
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number | boolean>;
      events?: {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: OnStateChangeEvent) => void;
        onError?: (event: OnErrorEvent) => void;
      };
    }

    interface PlayerEvent {
      target: Player;
    }

    interface OnStateChangeEvent extends PlayerEvent {
      data: number;
    }

    interface OnErrorEvent extends PlayerEvent {
      data: number;
    }

    class Player {
      constructor(element: string | HTMLElement, options: PlayerOptions);
      destroy(): void;
      getCurrentTime(): number;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      playVideo(): void;
      pauseVideo(): void;
      getPlayerState(): number;
    }

    enum PlayerState {
      UNSTARTED = -1,
      ENDED = 0,
      PLAYING = 1,
      PAUSED = 2,
      BUFFERING = 3,
      CUED = 5,
    }
  }
}
