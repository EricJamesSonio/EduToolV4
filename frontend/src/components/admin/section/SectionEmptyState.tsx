// filepath: app/admin/sections/_components/SectionEmptyState.tsx

"use client";

import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionEmptyStateProps {
  isFiltered: boolean;
  onCreateClick: () => void;
}

export function SectionEmptyState({
  isFiltered,
  onCreateClick,
}: SectionEmptyStateProps): React.JSX.Element {
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