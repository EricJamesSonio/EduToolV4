import { LayoutGrid } from "lucide-react";
import { EmptyState as SharedEmptyState } from "@/components/shared/EmptyState";

export function EmptyState() {
  return (
    <SharedEmptyState
      icon={LayoutGrid}
      title="No students found for this term."
      description="Try selecting a different term or class."
    />
  );
}