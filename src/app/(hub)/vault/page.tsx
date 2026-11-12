import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { AddVideoForm } from "@/components/vault/add-video-form";
import { VaultList } from "@/components/vault/vault-list";
import { hasDatabaseUrl } from "@/db";
import { createVaultVideo, listVaultVideos, type VaultItem } from "@/lib/vault/data";

function VaultListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-48 rounded bg-zinc-800/60" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-72 rounded-lg border border-zinc-800/80 bg-zinc-900/30"
          />
        ))}
      </div>
    </div>
  );
}

async function VaultDynamicContent() {
  await connection();
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  let items: VaultItem[] | null = null;
  if (isLoggedIn && hasDatabaseUrl() && session?.user?.id) {
    try {
      items = await listVaultVideos(session.user.id);
    } catch {
      items = [];
    }
  }

  return (
    <>
      {/* 3. Subtle 1-line status banner if signed out */}
      {!isLoggedIn ? (
        <div className="flex flex-col sm:flex-row sm:h-11 sm:items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm">
          <span className="font-mono text-zinc-300">
            Sign in to save videos and open them on your other devices.
          </span>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/vault" });
            }}
          >
            <button
              type="submit"
              className="font-mono text-xs font-semibold text-zinc-100 hover:text-white underline underline-offset-4"
            >
              Sign in with Google →
            </button>
          </form>
        </div>
      ) : null}

      {/* 4. Vault Content / Dense Grid */}
      {isLoggedIn ? (
        <VaultList items={items ?? []} />
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center space-y-2">
          <p className="font-mono text-sm font-semibold text-zinc-200">
            Your vault is empty until you sign in.
          </p>
          <p className="font-mono text-xs text-zinc-400">
            Saved videos and notes stay on your account, not in this browser.
          </p>
        </div>
      )}
    </>
  );
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function WatchRedirect({
  searchParams,
}: {
  searchParams: Promise<{ watch?: string }>;
}) {
  const { watch } = await searchParams;
  if (!watch) {
    return null;
  }

  const session = await auth();
  if (!session?.user?.id || !hasDatabaseUrl()) {
    return null;
  }

  try {
    const item = await createVaultVideo(session.user.id, watch);
    redirect(`/vault/${item.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
  }

  return null;
}

export default function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ watch?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-8 py-7">
      {/* 1. Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="h-8 flex items-center rounded-md bg-zinc-100 px-3 text-xs md:text-[13px] font-semibold text-zinc-950 shadow-xs">
            All Study Sessions
          </span>
          <span className="h-8 flex items-center rounded-md px-3 text-xs md:text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 cursor-pointer transition-colors">
            In Progress
          </span>
          <span className="h-8 flex items-center rounded-md px-3 text-xs md:text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 cursor-pointer transition-colors">
            Completed
          </span>
        </div>

        <div className="font-mono text-xs text-zinc-400">
          60/40 Split Learning Engine
        </div>
      </div>

      <Suspense fallback={null}>
        <WatchRedirect searchParams={searchParams} />
      </Suspense>

      <AddVideoForm />

      {/* 3 & 4. Dynamic Session & Study Content */}
      <Suspense fallback={<VaultListSkeleton />}>
        <VaultDynamicContent />
      </Suspense>
    </main>
  );
}
