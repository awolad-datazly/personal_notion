export const STORAGE_UPDATE_EVENT = "devpulse-storage-update";

export type StorageUpdateDetail = {
  key?: string;
  timestamp?: number;
};

/**
 * Dispatches a lightweight in-window custom event so all mounted components
 * and tabs immediately react to localStorage updates without a full page reload.
 */
export function notifyStorageUpdate(key?: string) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<StorageUpdateDetail>(STORAGE_UPDATE_EVENT, {
        detail: { key, timestamp: Date.now() },
      })
    );
  } catch {
    // Graceful fallback for non-browser or test environments
  }
}

/**
 * Subscription helper for useSyncExternalStore that listens to both
 * inter-tab native `storage` events and intra-window `devpulse-storage-update` events.
 */
export function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleUpdate = () => callback();

  window.addEventListener("storage", handleUpdate);
  window.addEventListener(STORAGE_UPDATE_EVENT, handleUpdate);

  return () => {
    window.removeEventListener("storage", handleUpdate);
    window.removeEventListener(STORAGE_UPDATE_EVENT, handleUpdate);
  };
}
