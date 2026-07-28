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
      <div className="rounded-lg border bg-card px-6 py-16 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground not-interactive">
          No school year selected
        </p>
        <p className="text-xs text-muted-foreground mt-1 not-interactive">
          Please select a school year to view sections.
        </p>
      </div>
    );
  }

  // 📭 Empty / filtered states
  return (
    <div className="rounded-lg border bg-card px-6 py-16 text-center">
      <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />

      <p className="text-sm font-medium text-muted-foreground not-interactive">
        {isFiltered ? "No matching sections" : "No sections yet"}
      </p>

      <p className="text-xs text-muted-foreground mt-1 not-interactive">
        {isFiltered
          ? "Try adjusting your filters."
          : "This school year doesn’t have any sections yet."}
      </p>

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