"use server";

import {
  isFeatureFlagKey,
  setFeatureFlagPublic,
} from "@/lib/feature-flags";
import { requireAdmin } from "@/lib/session";

export async function toggleFeatureFlagAction(
  key: string,
  isEnabledForPublic: boolean,
) {
  await requireAdmin();

  if (!isFeatureFlagKey(key)) {
    throw new Error(`Unknown feature flag: ${key}`);
  }

  await setFeatureFlagPublic(key, isEnabledForPublic);
}
