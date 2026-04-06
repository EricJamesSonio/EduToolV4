// frontend/src/components/admin/section/SectionEmptyState.tsx
"use client";

import { CalendarDays, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionEmptyStateProps {
  isFiltered:    boolean;
  noSchoolYear?: boolean;
  onCreateClick: () => void;
}

export function SectionEmptyState({
  isFiltered,
  noSchoolYear,
  onCreateClick,
}: SectionEmptyStateProps): React.JSX.Element {
  if (noSchoolYear) {
    return (
      <div className="rounded-lg border bg-card px-6 py-16 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          No school year selected
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Select a school year above to view or manage sections.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card px-6 py-16 text-center">
      <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm font-medium text-muted-foreground">No sections found</p>
      <p className="text-xs text-muted-foreground mt-1">
        {isFiltered
          ? "No sections for this level yet."
          : "Create your first section to get started."}
      </p>
      <Button size="sm" variant="outline" className="mt-4" onClick={onCreateClick}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        New Section
      </Button>
    </div>
  );
}