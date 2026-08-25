import { LayoutGrid } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-10 text-center text-muted-foreground md:min-h-[400px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <LayoutGrid className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">No students found for this term.</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">Try selecting a different term or class.</p>
    </div>
  );
}
