import "server-only";

import { notFound } from "next/navigation";

import {
  isFeatureEnabled,
  type FeatureFlagKey,
} from "@/lib/feature-flags";

export async function requireFeature(flag: FeatureFlagKey) {
  if (!(await isFeatureEnabled(flag))) {
    notFound();
  }
}
