import { NextResponse } from "next/server";

import { summarizeWithGemini } from "@/lib/ai/gemini";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getTechNewsItem, saveNewsSummary } from "@/lib/news/data";
import { GEMINI_KEY_HEADER } from "@/lib/gemini-key";
import {
  clientIpFromRequest,
  rateLimit,
} from "@/lib/security/rate-limit";
import { auth } from "@/auth";
import { hasDatabaseUrl } from "@/db";

type SummarizeBody = {
  newsId?: string;
  title?: string;
  url?: string;
  excerpt?: string;
  persist?: boolean;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const limitKey = `ai-summarize:${session.user.id}:${clientIpFromRequest(request)}`;
  const limited = rateLimit(limitKey, { limit: 20, windowMs: 60_000 });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many summarize requests. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000)),
          ),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  if (!(await isFeatureEnabled("ai_summarizer", { role: session.user.role }))) {
    return NextResponse.json(
      { error: "AI Summarizer is not enabled." },
      { status: 403 },
    );
  }

  const apiKey = request.headers.get(GEMINI_KEY_HEADER)?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: `Missing ${GEMINI_KEY_HEADER}. Save a Gemini key in the header dialog first.`,
      },
      { status: 400 },
    );
  }

  let body: SummarizeBody;

  try {
    body = (await request.json()) as SummarizeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let title = body.title?.trim() ?? "";
  let url = body.url?.trim() ?? "";
  let excerpt = body.excerpt?.trim() || null;
  const newsId = body.newsId?.trim();

  if (newsId) {
    if (!hasDatabaseUrl()) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured." },
        { status: 500 },
      );
    }

    const item = await getTechNewsItem(newsId);
    if (!item) {
      return NextResponse.json({ error: "News item not found." }, { status: 404 });
    }

    title = item.title;
    url = item.url;
    excerpt = excerpt ?? item.summary;
  }

  if (!title || !url) {
    return NextResponse.json(
      { error: "title and url are required." },
      { status: 400 },
    );
  }

  try {
    const summary = await summarizeWithGemini({
      apiKey,
      title,
      url,
      excerpt,
    });

    if (newsId && body.persist !== false && hasDatabaseUrl()) {
      await saveNewsSummary(newsId, summary);
    }

    return NextResponse.json({
      summary,
      model: "gemini-1.5-flash",
      persisted: Boolean(newsId && body.persist !== false),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Summarization failed.",
      },
      { status: 502 },
    );
  }
}
