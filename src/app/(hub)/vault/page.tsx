import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Clock, Play } from "lucide-react";

import { auth, signIn } from "@/auth";
import { ActiveVaultWorkspace } from "@/components/vault/active-vault-workspace";
import { AddVideoForm } from "@/components/vault/add-video-form";
import { VaultList } from "@/components/vault/vault-list";
import { hasDatabaseUrl } from "@/db";
import { listVaultVideos, type VaultItem } from "@/lib/vault/data";

const SAMPLE_STUDY_VIDEOS = [
  {
    id: "demo-1",
    title: "Building High-Throughput Microservices in Go & gRPC",
    channel: "ArjanCodes • 48m",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    videoId: "kYv_8w4-f-M",
    timestamps: [
      { time: "12:45", note: "Connection pooling & backpressure strategies" },
      { time: "28:10", note: "Graceful shutdown with context cancellation" },
      { time: "41:20", note: "Benchmarking p99 tail latencies under 50k QPS" },
    ],
  },
  {
    id: "demo-2",
    title: "Next.js 16 Server Components & Modern React 19 Patterns",
    channel: "Lee Robinson • 35m",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
    videoId: "T_8N_b37Q6M",
    timestamps: [
      { time: "05:12", note: "Partial prerendering vs streaming dynamic boundaries" },
      { time: "16:40", note: "Server actions with optimistic UI transitions" },
      { time: "29:05", note: "Caching primitives & use cache directive" },
    ],
  },
  {
    id: "demo-3",
    title: "Distributed Systems: Kafka Event Log Compaction Internals",
    channel: "Confluent • 52m",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
    videoId: "yXn3R7A8-K8",
    timestamps: [
      { time: "08:40", note: "Partitioning strategies & replica lag mitigation" },
      { time: "22:15", note: "Log compaction vs segment rollover internals" },
      { time: "37:50", note: "Consumer group rebalancing protocols" },
    ],
  },
];

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
            Guest session • Study preview active. Sign in to sync across desktop and mobile.
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
      {isLoggedIn && items && items.length > 0 ? (
        <VaultList items={items} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-300">
              Study Library Sessions
            </span>
            <span className="font-mono text-xs text-zinc-400">
              Click to launch player + markdown drawer
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_STUDY_VIDEOS.map((video) => (
              <div
                key={video.id}
                className="group flex flex-col justify-between overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30 transition-colors hover:border-zinc-700 shadow-xs"
              >
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Dark glassmorphic play pill */}
                  <Link
                    href={`/vault?watch=${encodeURIComponent(video.videoId)}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs"
                  >
                    <div className="flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/90 px-4 font-mono text-sm font-medium text-zinc-100 shadow-md">
                      <Play className="size-3.5 fill-current" />
                      <span>Launch Session</span>
                    </div>
                  </Link>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-mono text-zinc-200">
                    <span className="truncate max-w-[200px]">{video.channel}</span>
                    <span className="rounded bg-black/80 px-1.5 py-0.5 text-xs">YouTube</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4 space-y-3.5">
                  <div>
                    <Link
                      href={`/vault?watch=${encodeURIComponent(video.videoId)}`}
                      className="line-clamp-2 text-base md:text-[17px] font-semibold leading-snug text-zinc-100 group-hover:text-white transition-colors"
                    >
                      {video.title}
                    </Link>

                    <div className="mt-3 space-y-1.5">
                      {video.timestamps.map((ts) => (
                        <div
                          key={ts.time}
                          className="flex items-start gap-2 font-mono text-xs text-zinc-300"
                        >
                          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-zinc-800/90 px-2 py-0.5 text-xs text-zinc-200 border border-zinc-700/60">
                            <Clock className="size-3 text-zinc-400" />
                            {ts.time}
                          </span>
                          <span className="line-clamp-1 text-zinc-300">{ts.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 font-mono text-xs">
                    <span className="text-zinc-400">{video.timestamps.length} notes</span>
                    <Link
                      href={`/vault?watch=${encodeURIComponent(video.videoId)}`}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-zinc-100 px-3.5 font-medium text-xs text-zinc-950 hover:bg-white transition-colors shadow-xs"
                    >
                      <span>Study Mode</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function VaultPage() {
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

      {/* Active Split-Screen Study Workspace (if ?watch=... is set) */}
      <Suspense fallback={null}>
        <ActiveVaultWorkspace />
      </Suspense>

      {/* 2. Top Raycast-Style Video URL Bar */}
      <AddVideoForm />

      {/* 3 & 4. Dynamic Session & Study Content */}
      <Suspense fallback={<VaultListSkeleton />}>
        <VaultDynamicContent />
      </Suspense>
    </main>
  );
}
