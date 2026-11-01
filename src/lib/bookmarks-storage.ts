import { notifyStorageUpdate } from "@/lib/storage-bus";

export type BookmarkType = "ALL" | "VIDEO" | "ARTICLE" | "NOTE";

export type BookmarkItem = {
  id: string;
  type?: "VIDEO" | "ARTICLE" | "NOTE";
  title: string;
  source: string;
  date?: string;
  notes?: string;
  url: string;
  summary?: string;
  tags?: string[];
};

export const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: "bm-1",
    type: "VIDEO",
    title: "Rust Ownership, Lifetimes, and Zero-Copy I/O Notes",
    source: "YouTube • 3 timestamps",
    date: "Oct 28, 2026",
    notes: "std::io buffer reuse across worker threads without atomic locks; pinned memory with pin-project crate.",
    url: "/vault",
  },
  {
    id: "bm-2",
    type: "ARTICLE",
    title: "The Anatomy of a Production Distributed LSM Storage Engine",
    source: "Hacker News Signal",
    date: "Oct 25, 2026",
    notes: "MemTable write stalls, Bloom filter false-positive curve tuning, and read-amplification tradeoffs in RocksDB.",
    url: "/articles",
  },
  {
    id: "bm-3",
    type: "VIDEO",
    title: "Next.js 16 Partial Prerendering: Instant Static Shells & Streaming Dynamics",
    source: "YouTube • 4 timestamps",
    date: "Oct 22, 2026",
    notes: "Cache tag invalidation rules in App Router; wrapping un-cached headers() / cookies() in Suspense boundaries.",
    url: "/vault",
  },
  {
    id: "bm-4",
    type: "NOTE",
    title: "Consensus Protocols Cheat Sheet: Raft vs PBFT vs Paxos",
    source: "Scratchpad Save",
    date: "Oct 19, 2026",
    notes: "Raft leader election safety invariant: a candidate must have an up-to-date log compared to quorum to win votes.",
    url: "/#scratchpad",
  },
];

const BOOKMARKS_STORAGE_KEY = "devpulse.bookmarks";

let _cachedRaw: string | null = null;
let _cachedBookmarks: BookmarkItem[] = INITIAL_BOOKMARKS;

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") {
    return INITIAL_BOOKMARKS;
  }

  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (raw === _cachedRaw) {
      return _cachedBookmarks;
    }
    _cachedRaw = raw;

    if (!raw) {
      _cachedBookmarks = INITIAL_BOOKMARKS;
      return INITIAL_BOOKMARKS;
    }

    const parsed = JSON.parse(raw) as BookmarkItem[];
    _cachedBookmarks = Array.isArray(parsed) ? parsed : INITIAL_BOOKMARKS;
    return _cachedBookmarks;
  } catch {
    return INITIAL_BOOKMARKS;
  }
}

export function saveBookmark(item: BookmarkItem): void {
  if (typeof window === "undefined") return;

  try {
    const current = getBookmarks();
    const normalized: BookmarkItem = {
      ...item,
      type: item.type || "ARTICLE",
      date:
        item.date ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      notes: item.notes || item.summary || "",
    };

    const existingIndex = current.findIndex(
      (b) => b.id === normalized.id || b.url === normalized.url,
    );

    let updated: BookmarkItem[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...normalized };
    } else {
      updated = [normalized, ...current];
    }

    _cachedRaw = JSON.stringify(updated);
    _cachedBookmarks = updated;
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, _cachedRaw);
    notifyStorageUpdate("bookmarks");
  } catch {
    // Graceful error handling
  }
}

export function removeBookmark(idOrUrl: string): void {
  if (typeof window === "undefined") return;

  try {
    const current = getBookmarks();
    const updated = current.filter((b) => b.id !== idOrUrl && b.url !== idOrUrl);
    _cachedRaw = JSON.stringify(updated);
    _cachedBookmarks = updated;
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, _cachedRaw);
    notifyStorageUpdate("bookmarks");
  } catch {
    // Graceful error handling
  }
}

export function isBookmarked(idOrUrl: string): boolean {
  const current = getBookmarks();
  return current.some((b) => b.id === idOrUrl || b.url === idOrUrl);
}

export function toggleBookmark(item: BookmarkItem): boolean {
  if (isBookmarked(item.url || item.id)) {
    removeBookmark(item.id);
    return false;
  } else {
    saveBookmark(item);
    return true;
  }
}
