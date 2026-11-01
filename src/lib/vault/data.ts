import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db";
import {
  notes,
  resources,
  type Note,
  type NoteTimestamp,
  type Resource,
} from "@/db/schema";
import {
  extractYouTubeId,
  fetchYouTubeTitle,
  youtubeWatchUrl,
} from "@/lib/youtube";

export type VaultItem = Resource & {
  note: Note | null;
  videoId: string | null;
};

function assertDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local.",
    );
  }
}

export async function listVaultVideos(userId: string): Promise<VaultItem[]> {
  assertDatabase();

  const rows = await getDb()
    .select({
      resource: resources,
      note: notes,
    })
    .from(resources)
    .leftJoin(notes, eq(notes.resourceId, resources.id))
    .where(and(eq(resources.userId, userId), eq(resources.type, "YOUTUBE")))
    .orderBy(desc(resources.createdAt));

  return rows.map(({ resource, note }) => ({
    ...resource,
    note,
    videoId: extractYouTubeId(resource.url),
  }));
}

export async function getVaultVideo(
  userId: string,
  resourceId: string,
): Promise<VaultItem | null> {
  assertDatabase();

  const [row] = await getDb()
    .select({
      resource: resources,
      note: notes,
    })
    .from(resources)
    .leftJoin(notes, eq(notes.resourceId, resources.id))
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.userId, userId),
        eq(resources.type, "YOUTUBE"),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row.resource,
    note: row.note,
    videoId: extractYouTubeId(row.resource.url),
  };
}

export async function createVaultVideo(userId: string, rawUrl: string) {
  assertDatabase();

  const videoId = extractYouTubeId(rawUrl);

  if (!videoId) {
    throw new Error("Enter a valid YouTube URL or video id.");
  }

  const url = youtubeWatchUrl(videoId);
  const title = (await fetchYouTubeTitle(videoId)) ?? `YouTube ${videoId}`;
  const db = getDb();

  const [resource] = await db
    .insert(resources)
    .values({
      userId,
      type: "YOUTUBE",
      url,
      title,
      domain: "youtube.com",
      status: "TO_READ",
    })
    .returning();

  const [note] = await db
    .insert(notes)
    .values({
      resourceId: resource.id,
      userId,
      content: "",
      timestamps: [],
    })
    .returning();

  return {
    ...resource,
    note,
    videoId,
  } satisfies VaultItem;
}

export async function updateVaultVideoStatus(
  userId: string,
  resourceId: string,
  status: Resource["status"],
) {
  assertDatabase();

  const [updated] = await getDb()
    .update(resources)
    .set({ status })
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.userId, userId),
        eq(resources.type, "YOUTUBE"),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function deleteVaultVideo(userId: string, resourceId: string) {
  assertDatabase();

  const [deleted] = await getDb()
    .delete(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.userId, userId),
        eq(resources.type, "YOUTUBE"),
      ),
    )
    .returning({ id: resources.id });

  return Boolean(deleted);
}

export async function saveVaultNote(
  userId: string,
  resourceId: string,
  input: {
    content: string;
    timestamps: NoteTimestamp[];
  },
) {
  assertDatabase();

  const owned = await getDb()
    .select({ id: resources.id })
    .from(resources)
    .where(
      and(
        eq(resources.id, resourceId),
        eq(resources.userId, userId),
        eq(resources.type, "YOUTUBE"),
      ),
    )
    .limit(1);

  if (!owned[0]) {
    throw new Error("Video not found.");
  }

  const [existing] = await getDb()
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.resourceId, resourceId), eq(notes.userId, userId)))
    .limit(1);

  if (existing) {
    const [updated] = await getDb()
      .update(notes)
      .set({
        content: input.content,
        timestamps: input.timestamps,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await getDb()
    .insert(notes)
    .values({
      resourceId,
      userId,
      content: input.content,
      timestamps: input.timestamps,
    })
    .returning();

  return created;
}
