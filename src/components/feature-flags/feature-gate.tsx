import type { ReactNode } from "react";

import {
  isFeatureEnabled,
  type FeatureFlagKey,
} from "@/lib/feature-flags";

export async function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: FeatureFlagKey;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const enabled = await isFeatureEnabled(flag);

  if (!enabled) {
    return fallback;
  }

  return children;
}
