import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen } from "lucide-react";

interface SubjectEmptyStateProps {
  showNoSchoolYear?: boolean;
  onCreateClick?: () => void;
}

export function SubjectEmptyState({
  showNoSchoolYear = false,
  onCreateClick,
}: SubjectEmptyStateProps) {
  if (showNoSchoolYear) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No school year selected"
        description="Select a school year above to view subjects."
      />
    );
  }

  return (
    <EmptyState
      icon={BookOpen}
      title="No subjects found"
      description="Create a new subject to get started."
      action={
        onCreateClick
          ? {
              label: "New Subject",
              onClick: onCreateClick,
            }
          : undefined
      }
    />
  );
}