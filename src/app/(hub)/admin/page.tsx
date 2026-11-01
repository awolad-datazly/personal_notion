import { Suspense } from "react";
import { connection } from "next/server";
import { SlidersHorizontal, ShieldCheck } from "lucide-react";

import { AdminFeatureFlags } from "@/components/feature-flags/admin-feature-flags";
import { requireAdmin } from "@/lib/session";

async function AdminContent() {
  await connection();
  await requireAdmin();
  return <AdminFeatureFlags />;
}

function AdminSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6 animate-pulse">
      <div className="h-5 w-48 rounded bg-zinc-800 mb-2" />
      <div className="h-4 w-72 rounded bg-zinc-800/60" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-7">
      {/* Control Bar */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-800/80 pb-3 mb-6">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 font-semibold text-zinc-950 shadow-xs">
            <SlidersHorizontal className="size-4" />
            <span>Rollout Controls</span>
          </span>
          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400 font-medium">
            ADMIN SCOPE
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
          <ShieldCheck className="size-4" />
          <span>Privilege Verified</span>
        </div>
      </div>

      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </main>
  );
}
