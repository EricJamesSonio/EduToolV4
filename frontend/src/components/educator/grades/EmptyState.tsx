import { LayoutGrid } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-xl bg-card">
      <LayoutGrid className="h-8 w-8 opacity-30" />
      <p className="text-sm">No students found for this term.</p>
    </div>
  );
}
