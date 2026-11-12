import { formatTimestamp } from "../youtube";

export type LibraryResourceType = "YOUTUBE" | "ARTICLE" | "NOTE";

export type NoteMark = {
  seconds: number;
  label?: string;
};

export type ContinueSource = {
  id: string;
  type: LibraryResourceType;
  title: string;
  url: string;
  lastOpenedAt: string | null;
  timestamps: NoteMark[];
};

export type ContinueCard = {
  id: string;
  title: string;
  href: string;
  kindLabel: string;
  timestampCount: number;
  lastPosition: string | null;
};

export type BookmarkSource = {
  id: string;
  type: LibraryResourceType;
  title: string;
  url: string;
  notes: string;
  createdAt: string;
};

export type LibraryBookmark = {
  id: string;
  type: "VIDEO" | "ARTICLE" | "NOTE";
  title: string;
  url: string;
  href: string;
  notes: string;
  date: string;
};

const BOOKMARK_TYPE = {
  YOUTUBE: "VIDEO",
  ARTICLE: "ARTICLE",
  NOTE: "NOTE",
} as const;

export function toContinueStudyingCards(items: ContinueSource[]): ContinueCard[] {
  return items
    .filter((item) => Boolean(item.lastOpenedAt) && item.type !== "NOTE")
    .map((item) => {
      const marks = [...item.timestamps].sort((a, b) => a.seconds - b.seconds);
      const last = marks.at(-1) ?? null;

      return {
        id: item.id,
        title: item.title,
        href:
          item.type === "YOUTUBE"
            ? `/vault/${item.id}`
            : `/articles?read=${encodeURIComponent(item.url)}`,
        kindLabel: item.type === "YOUTUBE" ? "Video" : "Article",
        timestampCount: marks.length,
        lastPosition: last ? (last.label ?? formatTimestamp(last.seconds)) : null,
      };
    });
}

export function toLibraryBookmarks(rows: BookmarkSource[]): LibraryBookmark[] {
  return rows.map((row) => ({
    id: row.id,
    type: BOOKMARK_TYPE[row.type],
    title: row.title,
    url: row.url,
    href:
      row.type === "YOUTUBE"
        ? `/vault/${row.id}`
        : row.type === "NOTE"
          ? "/#scratchpad"
          : row.url,
    notes: row.notes,
    date: row.createdAt.slice(0, 10),
  }));
}

export type ArticleRecord = {
  id: string;
  title: string;
  url: string;
  domain: string | null;
  status: "TO_READ" | "COMPLETED";
  summary: string;
  createdAt: string;
};

export type SignalBucket = "HN" | "GH" | "DEV" | "SUB" | "WEB";

export function signalBucket(item: {
  url: string;
  category: string | null;
}): SignalBucket {
  const url = item.url.toLowerCase();
  const category = (item.category ?? "").toLowerCase();

  if (url.includes("ycombinator") || category.includes("hacker")) {
    return "HN";
  }

  if (url.includes("github.com") || category.includes("github")) {
    return "GH";
  }

  if (
    url.includes("dev.to") ||
    category.includes("dev.to") ||
    category === "dev"
  ) {
    return "DEV";
  }

  if (
    url.includes("substack") ||
    url.includes("bytebytego") ||
    url.includes("pragmaticengineer") ||
    category.includes("substack")
  ) {
    return "SUB";
  }

  return "WEB";
}

export function formatRelativeTime(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const minutes = Math.floor(Math.max(0, now - then) / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}
