"use client";

import { CalendarDays, Layers, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { NoResultsState } from "@/components/shared/status/NoResultsState";

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
  if (noSchoolYear) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No school year selected"
        description="Please select a school year to view sections."
      />
    );
  }

  if (isFiltered) {
    return (
      <NoResultsState
        title="No matching sections"
        description="Try adjusting your filters."
        className="min-h-[360px] md:min-h-[400px]"
      />
    );
  }

  return (
    <EmptyState
      icon={Layers}
      title="No sections yet"
      description="This school year does not have any sections yet."
      action={{ label: "New Section", onClick: onCreateClick, icon: Plus }}
    />
  );
}