import { Skeleton } from "@/components/ui/skeleton";

export function AuthPanelFallback() {
  return (
    <div className="mt-8 space-y-3" aria-hidden="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
