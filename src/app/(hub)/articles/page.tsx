import { Suspense } from "react";
import { connection } from "next/server";

import { auth } from "@/auth";
import { ArticleLibrary } from "@/components/reader/article-library";
import { hasDatabaseUrl } from "@/db";
import { listArticles } from "@/lib/library/data";

async function ArticlesContent({
  searchParams,
}: {
  searchParams: Promise<{ read?: string }>;
}) {
  await connection();
  const [{ read }, session] = await Promise.all([searchParams, auth()]);

  let articles: Awaited<ReturnType<typeof listArticles>> = [];
  if (session?.user.id && hasDatabaseUrl()) {
    try {
      articles = await listArticles(session.user.id);
    } catch {
      articles = [];
    }
  }

  return (
    <ArticleLibrary
      articles={articles}
      initialReadUrl={read}
      signedIn={Boolean(session?.user)}
    />
  );
}

export default function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ read?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-7">
      <Suspense
        fallback={
          <div className="h-40 rounded-lg border border-zinc-800/80 bg-zinc-900/30" />
        }
      >
        <ArticlesContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
