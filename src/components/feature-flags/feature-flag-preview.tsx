import { connection } from "next/server";

import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { FEATURE_FLAG_CATALOG, isFeatureEnabled } from "@/lib/feature-flags";

export async function FeatureFlagPreview() {
  await connection();
  const session = await auth();
  const role = session?.user.role ?? null;

  const modules = await Promise.all(
    FEATURE_FLAG_CATALOG.map(async (flag) => ({
      ...flag,
      enabled: await isFeatureEnabled(flag.key, { role }),
    })),
  );

  return (
    <section className="mt-8 rounded-xl border border-border bg-card/60 p-6">
      <h2 className="text-sm font-medium tracking-tight text-foreground">
        Module visibility
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Resolved for {role ?? "signed-out visitors"} through the feature flag
        guard.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {modules.map((module) => (
          <li key={module.key}>
            <Badge
              variant={module.enabled ? "default" : "secondary"}
              className={
                module.enabled
                  ? undefined
                  : "border-border bg-transparent text-caption"
              }
            >
              {module.name}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
