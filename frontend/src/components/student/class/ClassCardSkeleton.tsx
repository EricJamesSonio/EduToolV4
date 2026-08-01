import { Skeleton } from "@/components/ui/skeleton";
import { listItemCardClass } from "@/components/shared/ListItemCard";

export function ClassCardSkeleton() {
  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-md shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}
