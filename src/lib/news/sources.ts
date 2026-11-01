import { XMLParser } from "fast-xml-parser";

import type { ScrapedNewsItem } from "@/lib/news/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(candidate: string) {
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function compactItems(
  items: Array<ScrapedNewsItem | null>,
): ScrapedNewsItem[] {
  return items.filter((item): item is ScrapedNewsItem => item !== null);
}

async function fetchText(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, application/json, text/xml",
        "User-Agent": "PersonalNotionDevHub/1.0",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  }
}

async function scrapeHackerNews(): Promise<ScrapedNewsItem[]> {
  try {
    const response = await fetch(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      hits?: Array<{
        title?: string;
        url?: string | null;
        story_url?: string | null;
        objectID?: string;
        points?: number;
      }>;
    };

    return compactItems(
      (payload.hits ?? []).map((hit) => {
        const url =
          absoluteUrl(hit.url ?? "") ??
          absoluteUrl(hit.story_url ?? "") ??
          (hit.objectID
            ? `https://news.ycombinator.com/item?id=${hit.objectID}`
            : null);

        if (!hit.title || !url) {
          return null;
        }

        const item: ScrapedNewsItem = {
          title: cleanText(hit.title),
          url,
          category: "Hacker News",
        };

        if (hit.points != null) {
          item.summary = `${hit.points} points on HN`;
        }

        return item;
      }),
    );
  } catch {
    return [];
  }
}

async function scrapeDevTo(): Promise<ScrapedNewsItem[]> {
  try {
    const response = await fetch("https://dev.to/api/articles?top=7&per_page=15", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return [];
    }

    const articles = (await response.json()) as Array<{
      title?: string;
      url?: string;
      description?: string;
    }>;

    return compactItems(
      articles.map((article) => {
        const url = absoluteUrl(article.url ?? "");
        if (!article.title || !url) {
          return null;
        }

        const summary = cleanText(article.description);
        const item: ScrapedNewsItem = {
          title: cleanText(article.title),
          url,
          category: "Dev.to",
        };

        if (summary) {
          item.summary = summary;
        }

        return item;
      }),
    );
  } catch {
    return [];
  }
}

async function scrapeRss(
  feedUrl: string,
  category: string,
): Promise<ScrapedNewsItem[]> {
  const xml = await fetchText(feedUrl);
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };

  const rssItems = asArray(parsed.rss?.channel?.item) as Array<{
    title?: unknown;
    link?: unknown;
    description?: unknown;
  }>;

  if (rssItems.length > 0) {
    return compactItems(
      rssItems.map((item) => {
        const url = absoluteUrl(cleanText(item.link));
        const title = cleanText(item.title);
        if (!url || !title) {
          return null;
        }

        const summary = cleanText(item.description).slice(0, 280);
        const next: ScrapedNewsItem = { title, url, category };
        if (summary) {
          next.summary = summary;
        }
        return next;
      }),
    ).slice(0, 15);
  }

  const atomEntries = asArray(parsed.feed?.entry) as Array<{
    title?: unknown;
    link?: unknown;
    summary?: unknown;
    content?: unknown;
  }>;

  return compactItems(
    atomEntries.map((entry) => {
      const links = asArray(entry.link) as Array<
        string | { "@_href"?: string; href?: string }
      >;
      const href = links
        .map((link) =>
          typeof link === "string"
            ? link
            : (link["@_href"] ?? link.href ?? ""),
        )
        .map(cleanText)
        .find(Boolean);
      const url = absoluteUrl(href ?? "");
      const title = cleanText(entry.title);

      if (!url || !title) {
        return null;
      }

      const summary = cleanText(entry.summary ?? entry.content).slice(0, 280);
      const next: ScrapedNewsItem = { title, url, category };
      if (summary) {
        next.summary = summary;
      }
      return next;
    }),
  ).slice(0, 15);
}

export async function scrapeTechNewsSources() {
  const results = await Promise.allSettled([
    scrapeHackerNews(),
    scrapeDevTo(),
    scrapeRss("https://www.theverge.com/rss/index.xml", "The Verge"),
    scrapeRss("https://hnrss.org/newest?points=100", "HN Rising"),
  ]);

  const items: ScrapedNewsItem[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors.push(
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown feed error",
      );
    }
  }

  const deduped = new Map<string, ScrapedNewsItem>();
  for (const item of items) {
    if (!deduped.has(item.url)) {
      deduped.set(item.url, item);
    }
  }

  return {
    items: [...deduped.values()],
    errors,
  };
}
