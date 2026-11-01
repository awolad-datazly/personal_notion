import { Skeleton } from "@/components/ui/skeleton";

export function FeatureFlagPreviewFallback() {
  return (
    <section className="mt-8 rounded-xl border border-border bg-card/60 p-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-4 w-56" />
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </section>
  );
}
