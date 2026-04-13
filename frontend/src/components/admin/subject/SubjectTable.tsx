import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useSubjectColumns } from "@/components/admin/subject/SubjectColumns";
import type { Subject } from "@/types/admin/subject.types";
import type { SubjectType } from "@/types/admin/subject.types";

interface SubjectTableProps {
  isLoading: boolean;
  subjects: Subject[];
  activeTab: SubjectType;
  filterLevelId: string;
  selectedCourseId: string;
  selectedStrandId: string;
  selectedProgramId: string;
  onLockClick: (subject: Subject) => void;
  onUnlockClick: (subject: Subject) => void;
}

export function SubjectTable({
  isLoading,
  subjects,
  activeTab,
  filterLevelId,
  selectedCourseId,
  selectedStrandId,
  selectedProgramId,
  onLockClick,
  onUnlockClick,
}: SubjectTableProps) {
  const columns = useSubjectColumns(onLockClick, onUnlockClick);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state
  if (subjects.length === 0) {
    let description = "";
    if (filterLevelId !== "all") {
      description = `No ${activeTab} subjects for this level yet.`;
    } else if (selectedCourseId !== "all") {
      description = `No ${activeTab} subjects for this course yet.`;
    } else if (selectedStrandId !== "all") {
      description = `No ${activeTab} subjects for this strand yet.`;
    } else if (selectedProgramId !== "all") {
      description = `No ${activeTab} subjects for this program yet.`;
    } else {
      description = `No ${activeTab} subjects found for this school year.`;
    }

    return (
      <EmptyState
        icon={BookOpen}
        title={`No ${activeTab} subjects found`}
        description={description}
      />
    );
  }

  // Table
  return (
    <>
      {activeTab === "minor" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Minor subjects can be shared to courses, strands, or levels within
            their program.
          </span>
        </div>
      )}
      <DataTable columns={columns} data={subjects} />
    </>
  );
}