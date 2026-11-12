import { Suspense } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";
import { BookmarkList } from "@/components/library/bookmark-list";
import { hasDatabaseUrl } from "@/db";
import { listBookmarkSources } from "@/lib/library/data";
import { toLibraryBookmarks } from "@/lib/library/present";

async function BookmarksContent() {
  await connection();

  const session = await auth();
  let items = toLibraryBookmarks([]);

  if (session?.user.id && hasDatabaseUrl()) {
    try {
      items = toLibraryBookmarks(await listBookmarkSources(session.user.id));
    } catch {
      items = [];
    }
  }

  return (
    <>
      {session?.user ? null : (
        <p className="mb-4 font-mono text-xs text-zinc-400">
          Sign in to see bookmarks saved on your account.
        </p>
      )}
      <BookmarkList items={items} />
    </>
  );
}

export default function BookmarksPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-7">
      <Suspense
        fallback={
          <div className="h-40 rounded-lg border border-zinc-800/80 bg-zinc-900/30" />
        }
      >
        <BookmarksContent />
      </Suspense>
    </main>
  );
}
