import "server-only";

import { and, count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db";
import { notes, resources } from "@/db/schema";
import type {
  ArticleRecord,
  BookmarkSource,
  ContinueSource,
} from "@/lib/library/present";
import { assertResourceOwner } from "@/lib/library/ownership";
import {
  articleTitleFromUrl,
  canonicalResourceUrl,
  SCRATCHPAD_URL,
} from "@/lib/library/urls";

function assertDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }
}

function excerpt(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= 180) {
    return compact;
  }
  return `${compact.slice(0, 177)}…`;
}

async function findOwnedByUrl(userId: string, url: string) {
  const [row] = await getDb()
    .select()
    .from(resources)
    .where(and(eq(resources.userId, userId), eq(resources.url, url)))
    .limit(1);

  if (!row) {
    return null;
  }

  assertResourceOwner(row.userId, userId);
  return row;
}

async function ensureNote(userId: string, resourceId: string, content = "") {
  const [existing] = await getDb()
    .select({ id: notes.id, content: notes.content })
    .from(notes)
    .where(and(eq(notes.resourceId, resourceId), eq(notes.userId, userId)))
    .limit(1);

  if (existing) {
    if (!existing.content.trim() && content.trim()) {
      await getDb()
        .update(notes)
        .set({ content, updatedAt: new Date() })
        .where(eq(notes.id, existing.id));
    }
    return;
  }

  await getDb().insert(notes).values({
    resourceId,
    userId,
    content,
    timestamps: [],
  });
}

export async function touchResource(userId: string, resourceId: string) {
  assertDatabase();

  const [row] = await getDb()
    .select({ id: resources.id, userId: resources.userId })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, userId)))
    .limit(1);

  if (!row) {
    return null;
  }

  assertResourceOwner(row.userId, userId);

  const [updated] = await getDb()
    .update(resources)
    .set({ lastOpenedAt: new Date() })
    .where(eq(resources.id, row.id))
    .returning({ id: resources.id });

  return updated ?? null;
}

export async function listContinueSources(
  userId: string,
): Promise<ContinueSource[]> {
  assertDatabase();

  const rows = await getDb()
    .select({ resource: resources, note: notes })
    .from(resources)
    .leftJoin(notes, eq(notes.resourceId, resources.id))
    .where(
      and(
        eq(resources.userId, userId),
        inArray(resources.type, ["YOUTUBE", "ARTICLE"]),
        isNotNull(resources.lastOpenedAt),
      ),
    )
    .orderBy(desc(resources.lastOpenedAt))
    .limit(5);

  return rows.map(({ resource, note }) => ({
    id: resource.id,
    type: resource.type,
    title: resource.title,
    url: resource.url,
    lastOpenedAt: resource.lastOpenedAt?.toISOString() ?? null,
    timestamps: note?.timestamps ?? [],
  }));
}

export async function listBookmarkSources(
  userId: string,
): Promise<BookmarkSource[]> {
  assertDatabase();

  const rows = await getDb()
    .select({ resource: resources, note: notes })
    .from(resources)
    .leftJoin(notes, eq(notes.resourceId, resources.id))
    .where(and(eq(resources.userId, userId), eq(resources.bookmarked, true)))
    .orderBy(desc(resources.createdAt));

  return rows.map(({ resource, note }) => ({
    id: resource.id,
    type: resource.type,
    title: resource.title,
    url: resource.url,
    notes: excerpt(note?.content ?? ""),
    createdAt: resource.createdAt.toISOString(),
  }));
}

export async function countBookmarks(userId: string) {
  assertDatabase();

  const [row] = await getDb()
    .select({ value: count() })
    .from(resources)
    .where(and(eq(resources.userId, userId), eq(resources.bookmarked, true)));

  return row?.value ?? 0;
}

export async function listBookmarkedUrls(userId: string) {
  assertDatabase();

  const rows = await getDb()
    .select({ url: resources.url })
    .from(resources)
    .where(and(eq(resources.userId, userId), eq(resources.bookmarked, true)));

  return rows.map((row) => row.url);
}

export async function listArticles(userId: string): Promise<ArticleRecord[]> {
  assertDatabase();

  const rows = await getDb()
    .select({ resource: resources, note: notes })
    .from(resources)
    .leftJoin(notes, eq(notes.resourceId, resources.id))
    .where(and(eq(resources.userId, userId), eq(resources.type, "ARTICLE")))
    .orderBy(
      sql`${resources.lastOpenedAt} DESC NULLS LAST`,
      desc(resources.createdAt),
    );

  return rows.map(({ resource, note }) => ({
    id: resource.id,
    title: resource.title,
    url: resource.url,
    domain: resource.domain,
    status: resource.status,
    summary: excerpt(note?.content ?? ""),
    createdAt: resource.createdAt.toISOString(),
  }));
}

export async function saveArticle(
  userId: string,
  rawUrl: string,
  title?: string,
) {
  assertDatabase();

  const canonical = canonicalResourceUrl(rawUrl);
  if ("error" in canonical || canonical.type !== "ARTICLE") {
    throw new Error(
      "error" in canonical
        ? canonical.error
        : "That link belongs in the video vault.",
    );
  }

  const resolvedTitle = articleTitleFromUrl(canonical.url, title);
  const existing = await findOwnedByUrl(userId, canonical.url);
  const db = getDb();

  if (existing) {
    const [updated] = await db
      .update(resources)
      .set({
        lastOpenedAt: new Date(),
        title: title?.trim() ? resolvedTitle : existing.title,
      })
      .where(eq(resources.id, existing.id))
      .returning();

    await ensureNote(userId, existing.id);
    return updated;
  }

  const [created] = await db
    .insert(resources)
    .values({
      userId,
      type: "ARTICLE",
      url: canonical.url,
      title: resolvedTitle,
      domain: canonical.domain,
      status: "TO_READ",
      bookmarked: false,
      lastOpenedAt: new Date(),
    })
    .returning();

  await ensureNote(userId, created.id);
  return created;
}

export async function toggleBookmark(
  userId: string,
  input: { url: string; title: string; summary?: string },
) {
  assertDatabase();

  const canonical = canonicalResourceUrl(input.url);
  if ("error" in canonical) {
    throw new Error(canonical.error);
  }

  const existing = await findOwnedByUrl(userId, canonical.url);
  const db = getDb();

  if (existing) {
    const next = !existing.bookmarked;
    await db
      .update(resources)
      .set({ bookmarked: next })
      .where(eq(resources.id, existing.id));

    if (input.summary) {
      await ensureNote(userId, existing.id, input.summary);
    }

    return next;
  }

  const title =
    canonical.type === "NOTE"
      ? "Scratchpad"
      : canonical.type === "YOUTUBE"
        ? input.title.trim().slice(0, 300) || "YouTube video"
        : articleTitleFromUrl(canonical.url, input.title);

  const [created] = await db
    .insert(resources)
    .values({
      userId,
      type: canonical.type,
      url: canonical.url,
      title,
      domain: canonical.domain,
      status: "TO_READ",
      bookmarked: true,
    })
    .returning();

  await ensureNote(userId, created.id, input.summary ?? "");
  return true;
}

export async function clearBookmark(userId: string, resourceId: string) {
  assertDatabase();

  const [row] = await getDb()
    .select({ id: resources.id, userId: resources.userId })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, userId)))
    .limit(1);

  if (!row) {
    return false;
  }

  assertResourceOwner(row.userId, userId);

  await getDb()
    .update(resources)
    .set({ bookmarked: false })
    .where(eq(resources.id, row.id));

  return true;
}

export async function isUrlBookmarked(userId: string, rawUrl: string) {
  assertDatabase();

  const canonical = canonicalResourceUrl(rawUrl);
  if ("error" in canonical) {
    return false;
  }

  const row = await findOwnedByUrl(userId, canonical.url);
  return Boolean(row?.bookmarked);
}

export async function getScratchpad(userId: string) {
  assertDatabase();

  const [row] = await getDb()
    .select({ content: notes.content })
    .from(resources)
    .leftJoin(notes, eq(notes.resourceId, resources.id))
    .where(and(eq(resources.userId, userId), eq(resources.url, SCRATCHPAD_URL)))
    .limit(1);

  return row?.content ?? "";
}

export async function saveScratchpad(userId: string, content: string) {
  assertDatabase();

  const existing = await findOwnedByUrl(userId, SCRATCHPAD_URL);
  const db = getDb();

  const resource =
    existing ??
    (
      await db
        .insert(resources)
        .values({
          userId,
          type: "NOTE",
          url: SCRATCHPAD_URL,
          title: "Scratchpad",
          domain: null,
          status: "TO_READ",
          bookmarked: false,
        })
        .returning()
    )[0];

  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(eq(notes.resourceId, resource.id))
    .limit(1);

  if (note) {
    await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, note.id));
    return;
  }

  await db.insert(notes).values({
    resourceId: resource.id,
    userId,
    content,
    timestamps: [],
  });
}
