import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag, updateTag } from "next/cache";

import { getDb, hasDatabaseUrl } from "@/db";
import { featureFlags, type FeatureFlag } from "@/db/schema";

import {
  FEATURE_FLAG_CATALOG,
  type FeatureFlagKey,
  isFeatureFlagKey,
} from "./catalog";

export const FEATURE_FLAGS_CACHE_TAG = "feature-flags";

export type FeatureFlagView = {
  id: string | null;
  key: FeatureFlagKey;
  name: string;
  description: string;
  isEnabledForPublic: boolean;
  updatedAt: Date | null;
};

function toView(
  definition: (typeof FEATURE_FLAG_CATALOG)[number],
  row: FeatureFlag | undefined,
): FeatureFlagView {
  return {
    id: row?.id ?? null,
    key: definition.key,
    name: definition.name,
    description: definition.description,
    isEnabledForPublic:
      row?.isEnabledForPublic ?? definition.defaultEnabledForPublic,
    updatedAt: row?.updatedAt ?? null,
  };
}

async function readFeatureFlagRows() {
  "use cache";

  cacheTag(FEATURE_FLAGS_CACHE_TAG);
  cacheLife("hours");

  if (!hasDatabaseUrl()) {
    return [] as FeatureFlag[];
  }

  return getDb().select().from(featureFlags).orderBy(asc(featureFlags.key));
}

export async function ensureFeatureFlags() {
  if (!hasDatabaseUrl()) {
    return;
  }

  const db = getDb();
  const keys = FEATURE_FLAG_CATALOG.map((flag) => flag.key);
  const existing = await db
    .select({ key: featureFlags.key })
    .from(featureFlags)
    .where(inArray(featureFlags.key, keys));
  const existingKeys = new Set(existing.map((row) => row.key));
  const missing = FEATURE_FLAG_CATALOG.filter(
    (flag) => !existingKeys.has(flag.key),
  );

  if (missing.length === 0) {
    return;
  }

  await db.insert(featureFlags).values(
    missing.map((flag) => ({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      isEnabledForPublic: flag.defaultEnabledForPublic,
    })),
  );
}

export async function listFeatureFlags(): Promise<FeatureFlagView[]> {
  const rows = await readFeatureFlagRows();
  const byKey = new Map(
    rows.filter((row) => isFeatureFlagKey(row.key)).map((row) => [row.key, row]),
  );

  return FEATURE_FLAG_CATALOG.map((definition) =>
    toView(definition, byKey.get(definition.key)),
  );
}

export async function getFeatureFlag(
  key: FeatureFlagKey,
): Promise<FeatureFlagView> {
  const flags = await listFeatureFlags();
  const flag = flags.find((item) => item.key === key);

  if (!flag) {
    throw new Error(`Unknown feature flag: ${key}`);
  }

  return flag;
}

export async function setFeatureFlagPublic(
  key: FeatureFlagKey,
  isEnabledForPublic: boolean,
) {
  if (!hasDatabaseUrl()) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env.local.",
    );
  }

  await ensureFeatureFlags();

  const [updated] = await getDb()
    .update(featureFlags)
    .set({
      isEnabledForPublic,
      updatedAt: new Date(),
    })
    .where(eq(featureFlags.key, key))
    .returning();

  if (!updated) {
    throw new Error(`Feature flag "${key}" was not found.`);
  }

  updateTag(FEATURE_FLAGS_CACHE_TAG);

  return updated;
}
