import "server-only";

import { auth } from "@/auth";

import type { FeatureFlagKey } from "./catalog";
import { getFeatureFlag } from "./data";

export async function isFeatureEnabled(
  key: FeatureFlagKey,
  options?: { role?: "ADMIN" | "USER" | null },
) {
  const role =
    options?.role === undefined
      ? (await auth())?.user.role ?? null
      : options.role;
  const flag = await getFeatureFlag(key);

  if (flag.isEnabledForPublic) {
    return true;
  }

  return role === "ADMIN";
}
