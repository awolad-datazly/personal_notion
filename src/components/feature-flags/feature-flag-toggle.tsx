"use client";

import { useTransition } from "react";

import { toggleFeatureFlagAction } from "@/app/actions/feature-flags";
import { Switch } from "@/components/ui/switch";
import type { FeatureFlagKey } from "@/lib/feature-flags";

export function FeatureFlagToggle({
  flagKey,
  enabled,
  disabled = false,
}: {
  flagKey: FeatureFlagKey;
  enabled: boolean;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={enabled}
      disabled={disabled || isPending}
      aria-label={`Enable ${flagKey} for the public`}
      onCheckedChange={(next) => {
        startTransition(async () => {
          await toggleFeatureFlagAction(flagKey, next);
        });
      }}
    />
  );
}
