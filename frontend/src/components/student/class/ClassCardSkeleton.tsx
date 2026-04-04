// frontend/src/components/student/class/ClassCardSkeleton.tsx
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassCardSkeleton(): React.JSX.Element {
  return (
    <Card className="flex flex-col border-border/60">
      <div className="h-1.5 w-full rounded-t-xl bg-muted" />
      <CardHeader className="pb-2 pt-4 px-5 space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
      <CardFooter className="px-5 pb-4">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}