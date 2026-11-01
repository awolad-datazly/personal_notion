import { connection } from "next/server";
import { Sliders } from "lucide-react";

import { auth } from "@/auth";
import { hasDatabaseUrl } from "@/db";
import { isFeatureEnabled, listFeatureFlags } from "@/lib/feature-flags";

import { FeatureFlagToggle } from "./feature-flag-toggle";

export async function AdminFeatureFlags() {
  await connection();
  const session = await auth();

  if (session?.user.role !== "ADMIN") {
    return null;
  }

  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Database Connection Required</h2>
        <p className="mt-1.5 text-xs font-mono text-zinc-300">
          Set <span className="text-zinc-100 font-semibold">DATABASE_URL</span> and
          run <span className="text-zinc-100 font-semibold">pnpm db:push</span> before
          toggling rollout switches.
        </p>
      </section>
    );
  }

  const flags = await listFeatureFlags();
  const visibility = await Promise.all(
    flags.map(async (flag) => ({
      key: flag.key,
      visibleToYou: await isFeatureEnabled(flag.key, { role: "ADMIN" }),
      visibleToPublic: flag.isEnabledForPublic,
    })),
  );
  const visibilityByKey = new Map(
    visibility.map((item) => [item.key, item] as const),
  );

  return (
    <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-zinc-300" />
            <h2 className="text-sm md:text-base font-semibold text-zinc-100">System Modules & Gateways</h2>
          </div>
          <p className="mt-1 text-xs md:text-[13px] font-mono text-zinc-300">
            Disabling public access restricts feature visibility to authenticated administrators.
          </p>
        </div>
        <span className="rounded border border-zinc-700/60 bg-zinc-800/80 px-2.5 py-1 font-mono text-xs text-zinc-300">
          {flags.length} Flags Loaded
        </span>
      </div>

      <div className="divide-y divide-zinc-800/60 border border-zinc-800/80 rounded-md bg-zinc-950/40">
        {flags.map((flag) => {
          const state = visibilityByKey.get(flag.key);

          return (
            <div
              key={flag.key}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-semibold text-zinc-100">{flag.name}</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {flag.key}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {flag.description}
                </p>
                <p className="font-mono text-xs text-zinc-400">
                  admin: {state?.visibleToYou ? "active" : "disabled"} · public:{" "}
                  {state?.visibleToPublic ? "enabled" : "restricted"}
                </p>
              </div>
              <FeatureFlagToggle
                flagKey={flag.key}
                enabled={flag.isEnabledForPublic}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
