import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { LearningWorkspace } from "@/components/vault/learning-workspace";
import { hasDatabaseUrl } from "@/db";
import { requireFeature } from "@/lib/module-access";
import { requireUser } from "@/lib/session";
import { getVaultVideo } from "@/lib/vault/data";

async function VaultSessionContent({
  idPromise,
}: {
  idPromise: Promise<{ id: string }>;
}) {
  await connection();
  const session = await requireUser();
  await requireFeature("video_vault");
  const { id } = await idPromise;

  if (!hasDatabaseUrl()) {
    return (
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6">
        <p className="text-sm font-mono text-zinc-400">
          Database is not configured for vault sessions.
        </p>
      </div>
    );
  }

  const item = await getVaultVideo(session.user.id, id);

  if (!item || !item.videoId) {
    notFound();
  }

  return (
    <LearningWorkspace
      resourceId={item.id}
      videoId={item.videoId}
      title={item.title}
      initialContent={item.note?.content ?? ""}
      initialTimestamps={item.note?.timestamps ?? []}
      updatedAt={item.note?.updatedAt?.toISOString() ?? null}
    />
  );
}

export default function VaultSessionPage({
  params,
}: PageProps<"/vault/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-8 py-7">
      <div className="mb-5">
        <Link
          href="/vault"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-3.5 font-mono text-sm font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors shadow-xs"
        >
          ← Back to vault
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-[600px] w-full rounded-lg border border-zinc-800/80 bg-zinc-900/30 animate-pulse" />
        }
      >
        <VaultSessionContent idPromise={params} />
      </Suspense>
    </main>
  );
}
