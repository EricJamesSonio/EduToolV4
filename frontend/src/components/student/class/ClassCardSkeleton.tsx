import { Skeleton } from "@/components/ui/skeleton";

export function ClassCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
