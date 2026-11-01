"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export type VaultPlayerApi = {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
};

type PlayerContextValue = {
  apiRef: React.MutableRefObject<VaultPlayerApi | null>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function VaultPlayerProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<VaultPlayerApi | null>(null);
  const value = useMemo(() => ({ apiRef }), []);

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function useVaultPlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("useVaultPlayer must be used within VaultPlayerProvider");
  }

  return context;
}
