"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { hasDatabaseUrl } from "@/db";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  clearBookmark,
  getScratchpad,
  isUrlBookmarked,
  saveArticle,
  saveScratchpad,
  toggleBookmark,
} from "@/lib/library/data";
import { canonicalResourceUrl } from "@/lib/library/urls";
import { createVaultVideo } from "@/lib/vault/data";

function revalidateLibrary() {
  revalidatePath("/");
  revalidatePath("/bookmarks");
  revalidatePath("/articles");
  revalidatePath("/vault");
  revalidatePath("/news");
}

type LibraryAccess =
  | { ok: false; error: string }
  | { ok: true; userId: string; role: "ADMIN" | "USER" };

async function signedInUser(): Promise<LibraryAccess> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "Sign in to save this to your library." };
  }

  if (!hasDatabaseUrl()) {
    return { ok: false, error: "Database is not configured." };
  }

  return {
    ok: true,
    userId,
    role: session.user.role === "ADMIN" ? "ADMIN" : "USER",
  };
}

export async function captureLinkAction(raw: string): Promise<
  | { kind: "youtube"; href: string }
  | { kind: "article"; url: string }
  | { error: string }
> {
  const access = await signedInUser();
  if (!access.ok) {
    return { error: access.error };
  }

  const canonical = canonicalResourceUrl(raw);
  if ("error" in canonical) {
    return canonical;
  }

  if (canonical.type === "NOTE") {
    return { error: "Paste a YouTube or article URL." };
  }

  try {
    if (canonical.type === "YOUTUBE") {
      if (
        !(await isFeatureEnabled("video_vault", {
          role: access.role,
        }))
      ) {
        return { error: "Video Vault is turned off." };
      }

      const item = await createVaultVideo(access.userId, canonical.url);
      revalidateLibrary();
      return { kind: "youtube", href: `/vault/${item.id}` };
    }

    if (
      !(await isFeatureEnabled("article_reader", {
        role: access.role,
      }))
    ) {
      return { error: "Article Reader is turned off." };
    }

    const article = await saveArticle(access.userId, canonical.url);
    revalidateLibrary();
    return { kind: "article", url: article.url };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save that link.",
    };
  }
}

export async function toggleBookmarkAction(input: {
  url: string;
  title: string;
  summary?: string;
}): Promise<{ bookmarked?: boolean; error?: string }> {
  const access = await signedInUser();
  if (!access.ok) {
    return { error: access.error };
  }

  try {
    const bookmarked = await toggleBookmark(access.userId, input);
    revalidateLibrary();
    return { bookmarked };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update that bookmark.",
    };
  }
}

export async function lookupBookmarkAction(url: string) {
  const access = await signedInUser();
  if (!access.ok) {
    return false;
  }

  try {
    return await isUrlBookmarked(access.userId, url);
  } catch {
    return false;
  }
}

export async function removeBookmarkAction(
  resourceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await signedInUser();
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  await clearBookmark(access.userId, resourceId);
  revalidateLibrary();
  return { ok: true };
}

export async function saveScratchpadAction(
  content: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await signedInUser();
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  await saveScratchpad(access.userId, content);
  return { ok: true };
}

export async function readScratchpadAction() {
  const access = await signedInUser();
  if (!access.ok) {
    return "";
  }

  try {
    return await getScratchpad(access.userId);
  } catch {
    return "";
  }
}
