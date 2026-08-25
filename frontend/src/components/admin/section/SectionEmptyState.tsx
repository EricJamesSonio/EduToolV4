"use client";

import { CalendarDays, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionEmptyStateProps {
  isFiltered: boolean;
  noSchoolYear?: boolean;
  onCreateClick: () => void;
}

export function SectionEmptyState({
  isFiltered,
  noSchoolYear,
  onCreateClick,
}: SectionEmptyStateProps): React.JSX.Element {
  // 🚫 No school year selected
  if (noSchoolYear) {
    return (
      <div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-10 text-center md:min-h-[400px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium not-interactive">No school year selected</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto not-interactive">
            Please select a school year to view sections.
          </p>
        </div>
      </div>
    );
  }

  // 📭 Empty / filtered states
  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-10 text-center md:min-h-[400px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Layers className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium not-interactive">
          {isFiltered ? "No matching sections" : "No sections yet"}
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto not-interactive">
          {isFiltered
            ? "Try adjusting your filters."
            : "This school year doesn’t have any sections yet."}
        </p>
      </div>

      {/* Only show CTA when NOT filtered */}
      {!isFiltered && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={onCreateClick}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Section
        </Button>
      )}
    </div>
  );
}