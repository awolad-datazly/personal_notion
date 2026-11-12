import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db";
import { techNews, type TechNewsItem } from "@/db/schema";
import { scrapeTechNewsSources } from "@/lib/news/sources";
import type { NewsListFilter, ScrapedNewsItem } from "@/lib/news/types";

function assertDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local.",
    );
  }
}

export async function listTechNews(
  filter: NewsListFilter = "all",
): Promise<TechNewsItem[]> {
  assertDatabase();

  const query = getDb()
    .select()
    .from(techNews)
    .orderBy(desc(techNews.isMustLearn), desc(techNews.createdAt))
    .limit(80);

  if (filter === "must-learn") {
    return getDb()
      .select()
      .from(techNews)
      .where(eq(techNews.isMustLearn, true))
      .orderBy(desc(techNews.createdAt))
      .limit(80);
  }

  return query;
}

export async function getTechNewsItem(id: string) {
  assertDatabase();

  const [item] = await getDb()
    .select()
    .from(techNews)
    .where(eq(techNews.id, id))
    .limit(1);

  return item ?? null;
}

export async function upsertScrapedNews(items: ScrapedNewsItem[]) {
  assertDatabase();

  if (items.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const db = getDb();
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    const [existing] = await db
      .select({ id: techNews.id, summary: techNews.summary })
      .from(techNews)
      .where(eq(techNews.url, item.url))
      .limit(1);

    if (!existing) {
      await db.insert(techNews).values({
        title: item.title,
        url: item.url,
        summary: item.summary,
        category: item.category,
        isMustLearn: false,
      });
      inserted += 1;
      continue;
    }

    await db
      .update(techNews)
      .set({
        title: item.title,
        category: item.category,
        summary: existing.summary ?? item.summary ?? null,
      })
      .where(eq(techNews.id, existing.id));
    updated += 1;
  }

  return { inserted, updated };
}

export async function refreshTechNewsFeed() {
  const { items, errors } = await scrapeTechNewsSources();
  const result = await upsertScrapedNews(items);

  return {
    ...result,
    scraped: items.length,
    errors,
  };
}

export async function setMustLearn(id: string, isMustLearn: boolean) {
  assertDatabase();

  const [updated] = await getDb()
    .update(techNews)
    .set({ isMustLearn })
    .where(eq(techNews.id, id))
    .returning();

  return updated ?? null;
}

export async function saveNewsSummary(id: string, summary: string) {
  assertDatabase();

  const [updated] = await getDb()
    .update(techNews)
    .set({ summary })
    .where(eq(techNews.id, id))
    .returning();

  return updated ?? null;
}
