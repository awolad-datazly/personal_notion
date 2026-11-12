import { extractYouTubeId, youtubeWatchUrl } from "../youtube";

export const SCRATCHPAD_URL = "scratchpad://notes";

export type CanonicalResource =
  | { type: "YOUTUBE"; url: string; domain: "youtube.com" }
  | { type: "ARTICLE"; url: string; domain: string }
  | { type: "NOTE"; url: typeof SCRATCHPAD_URL; domain: null };

export function canonicalResourceUrl(
  raw: string,
): CanonicalResource | { error: string } {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { error: "Enter a URL." };
  }

  if (trimmed === SCRATCHPAD_URL) {
    return { type: "NOTE", url: SCRATCHPAD_URL, domain: null };
  }

  const videoId = extractYouTubeId(trimmed);
  if (videoId) {
    return {
      type: "YOUTUBE",
      url: youtubeWatchUrl(videoId),
      domain: "youtube.com",
    };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return { error: "Paste a full http(s) URL." };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "Paste a full http(s) URL." };
    }

    return {
      type: "ARTICLE",
      url: url.toString(),
      domain: url.hostname.replace(/^www\./, ""),
    };
  } catch {
    return { error: "Paste a full http(s) URL." };
  }
}

export function articleTitleFromUrl(url: string, title?: string) {
  const trimmed = title?.trim();
  if (trimmed) {
    return trimmed.slice(0, 300);
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname.split("/").filter(Boolean).pop();
    if (path) {
      return decodeURIComponent(path).replace(/[-_]+/g, " ").slice(0, 300);
    }
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 300);
  }
}
