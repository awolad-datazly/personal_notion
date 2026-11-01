import { NextResponse } from "next/server";

export type SignalItem = {
  id: string;
  source: "HN" | "GH" | "DEV";
  sourceName: string;
  title: string;
  takeaway: string;
  category: string;
  url: string;
  metrics: string;
  time: string;
  createdAt: string;
};

const FALLBACK_SIGNALS: SignalItem[] = [
  {
    id: "hn-fallback-1",
    source: "HN",
    sourceName: "Hacker News",
    title: "Understanding Memory Ownership & Zero-Copy in High-Performance Distributed Engines",
    takeaway: "Zero-copy buffers and avoiding kernel context switches doubles query throughput on NVMe drives.",
    category: "Systems",
    url: "https://news.ycombinator.com",
    metrics: "482 pts • 142 comments",
    time: "2h ago",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "gh-fallback-2",
    source: "GH",
    sourceName: "GitHub Trending",
    title: "vllm-project/vllm: High-throughput and memory-efficient LLM serving engine with PagedAttention",
    takeaway: "PagedAttention manages attention keys and values with near-zero memory waste, quadrupling throughput.",
    category: "AI / Python",
    url: "https://github.com/vllm-project/vllm",
    metrics: "34.5k ★",
    time: "3h ago",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "dev-fallback-3",
    source: "DEV",
    sourceName: "Dev.to",
    title: "Zero-Downtime Database Schema Migrations at Scale: Lessons from 100M Rows",
    takeaway: "Dual-writing, backfilling in chunked batches, and lock-free constraint validation without tail latency spikes.",
    category: "Database",
    url: "https://dev.to/engineering/zero-downtime-postgres-migrations",
    metrics: "340 reactions",
    time: "5h ago",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "hn-fallback-4",
    source: "HN",
    sourceName: "Hacker News",
    title: "Inside the V8 Engine: Hidden Classes, Inline Caches & TurboFan Bailouts",
    takeaway: "Why monomorphic call sites run 5x faster than polymorphic sites in high-throughput Node.js microservices.",
    category: "Backend",
    url: "https://v8.dev/blog",
    metrics: "310 pts • 98 comments",
    time: "7h ago",
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
  },
  {
    id: "gh-fallback-5",
    source: "GH",
    sourceName: "GitHub Trending",
    title: "astral-sh/uv: An extremely fast Python package and project manager written in Rust",
    takeaway: "Resolves dependency graphs 10-100x faster than pip using lockfile determinism and global disk caches.",
    category: "Rust / Tooling",
    url: "https://github.com/astral-sh/uv",
    metrics: "42.1k ★",
    time: "9h ago",
    createdAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
  },
];

function formatRelativeTime(date: Date): string {
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (60 * 1000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function detectCategory(title: string, defaultCat = "Engineering"): string {
  const lower = title.toLowerCase();
  if (lower.includes("rust") || lower.includes("systems") || lower.includes("memory") || lower.includes("c++") || lower.includes("kernel")) {
    return "Systems";
  }
  if (lower.includes("ai") || lower.includes("llm") || lower.includes("gpt") || lower.includes("agent") || lower.includes("model")) {
    return "AI";
  }
  if (lower.includes("postgres") || lower.includes("sql") || lower.includes("database") || lower.includes("db") || lower.includes("redis")) {
    return "Database";
  }
  if (lower.includes("next.js") || lower.includes("react") || lower.includes("node") || lower.includes("browser") || lower.includes("css")) {
    return "Frontend";
  }
  if (lower.includes("distributed") || lower.includes("raft") || lower.includes("consensus") || lower.includes("microservice") || lower.includes("grpc")) {
    return "Architecture";
  }
  return defaultCat;
}

async function fetchHackerNews(): Promise<SignalItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 120 },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const ids = ((await res.json()) as number[]).slice(0, 10);

    const stories = await Promise.all(
      ids.map(async (id) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            next: { revalidate: 120 },
          });
          if (!itemRes.ok) return null;
          return (await itemRes.json()) as {
            id: number;
            title: string;
            url?: string;
            score?: number;
            time?: number;
            descendants?: number;
          };
        } catch {
          return null;
        }
      })
    );

    return stories
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.title))
      .map((s) => {
        const itemDate = s.time ? new Date(s.time * 1000) : new Date();
        const url = s.url || `https://news.ycombinator.com/item?id=${s.id}`;
        return {
          id: `hn-${s.id}`,
          source: "HN",
          sourceName: "Hacker News",
          title: s.title,
          takeaway: `Ranked on HN Frontpage with ${s.score ?? 0} points and community discussion.`,
          category: detectCategory(s.title, "Hacker News"),
          url,
          metrics: `${s.score ?? 0} pts • ${s.descendants ?? 0} comments`,
          time: formatRelativeTime(itemDate),
          createdAt: itemDate.toISOString(),
        };
      });
  } catch {
    return [];
  }
}

const DEV_FALLBACK_SIGNALS: SignalItem[] = [
  {
    id: "dev-fallback-1",
    source: "DEV",
    sourceName: "Dev.to",
    title: "Zero-Downtime Database Schema Migrations at Scale: Lessons from 100M Rows",
    takeaway: "Dual-writing, backfilling in chunked batches, and lock-free constraint validation without tail latency spikes.",
    category: "DATABASE",
    url: "https://dev.to/engineering/zero-downtime-postgres-migrations",
    metrics: "340 reactions",
    time: "3h ago",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "dev-fallback-2",
    source: "DEV",
    sourceName: "Dev.to",
    title: "Inside High-Performance Go: Memory Allocation, Inlining & Escape Analysis",
    takeaway: "Eliminating heap escapes and tuning GC target percentages to achieve sub-millisecond p99 latencies.",
    category: "GOLANG",
    url: "https://dev.to/tech/go-memory-allocation-and-escape-analysis",
    metrics: "285 reactions",
    time: "5h ago",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "dev-fallback-3",
    source: "DEV",
    sourceName: "Dev.to",
    title: "Designing Event-Driven Microservices with Kafka, Debezium & Outbox Pattern",
    takeaway: "Transactional outbox pattern guarantees exactly-once state publishing even during database disconnects.",
    category: "BACKEND",
    url: "https://dev.to/architecture/event-driven-microservices-kafka-outbox",
    metrics: "412 reactions",
    time: "7h ago",
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
  },
];

async function fetchDevTo(): Promise<SignalItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("https://dev.to/api/articles?top=1&per_page=10", {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) return DEV_FALLBACK_SIGNALS;
    const articles = (await res.json()) as Array<{
      id: number;
      title: string;
      description?: string;
      url: string;
      positive_reactions_count?: number;
      published_at?: string;
      tag_list?: string[];
    }>;

    const mapped = articles.map((art) => {
      const itemDate = art.published_at ? new Date(art.published_at) : new Date();
      const cat = art.tag_list && art.tag_list.length > 0
        ? art.tag_list[0].toUpperCase()
        : detectCategory(art.title, "Engineering");

      return {
        id: `dev-${art.id}`,
        source: "DEV" as const,
        sourceName: "Dev.to",
        title: art.title,
        takeaway: art.description || "Read technical architecture deep dive on Dev.to.",
        category: cat,
        url: art.url,
        metrics: `${art.positive_reactions_count ?? 0} reactions`,
        time: formatRelativeTime(itemDate),
        createdAt: itemDate.toISOString(),
      };
    });

    return mapped.length > 0 ? mapped : DEV_FALLBACK_SIGNALS;
  } catch {
    return DEV_FALLBACK_SIGNALS;
  }
}

async function fetchGitHubTrending(): Promise<SignalItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      "https://api.github.com/search/repositories?q=stars:>1000&sort=updated&order=desc&per_page=8",
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "DevPulse-TechHub",
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 300 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{
        id: number;
        full_name: string;
        description?: string;
        html_url: string;
        stargazers_count: number;
        language?: string;
        updated_at?: string;
      }>;
    };

    if (!data.items) return [];

    return data.items.map((repo) => {
      const itemDate = repo.updated_at ? new Date(repo.updated_at) : new Date();
      const starsFormatted =
        repo.stargazers_count > 1000
          ? `${(repo.stargazers_count / 1000).toFixed(1)}k ★`
          : `${repo.stargazers_count} ★`;

      return {
        id: `gh-${repo.id}`,
        source: "GH",
        sourceName: "GitHub",
        title: `${repo.full_name}: ${repo.description || "Open source project"}`,
        takeaway: repo.description || "Active high-velocity repository trending across developers.",
        category: repo.language || detectCategory(repo.full_name, "Open Source"),
        url: repo.html_url,
        metrics: starsFormatted,
        time: formatRelativeTime(itemDate),
        createdAt: itemDate.toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const [hnSignals, devSignals, ghSignals] = await Promise.all([
    fetchHackerNews(),
    fetchDevTo(),
    fetchGitHubTrending(),
  ]);

  let allSignals: SignalItem[] = [...hnSignals, ...devSignals, ...ghSignals];

  if (allSignals.length === 0) {
    allSignals = FALLBACK_SIGNALS;
  } else {
    // Interleave signals nicely: HN, GH, DEV
    allSignals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return NextResponse.json({
    signals: allSignals,
    refreshedAt: new Date().toISOString(),
    isLive: hnSignals.length > 0 || devSignals.length > 0 || ghSignals.length > 0,
  });
}
