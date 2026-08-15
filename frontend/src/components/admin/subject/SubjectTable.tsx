import { DataTable } from "@/components/shared/DataTable";
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
  onEditClick: (subject: Subject) => void;
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
  onEditClick,
  onLockClick,
  onUnlockClick,
}: SubjectTableProps) {
  const columns = useSubjectColumns(onEditClick, onLockClick, onUnlockClick);

  let emptyDescription = "";
  if (filterLevelId !== "all") {
    emptyDescription = `No ${activeTab} subjects for this level yet.`;
  } else if (selectedCourseId !== "all") {
    emptyDescription = `No ${activeTab} subjects for this course yet.`;
  } else if (selectedStrandId !== "all") {
    emptyDescription = `No ${activeTab} subjects for this strand yet.`;
  } else if (selectedProgramId !== "all") {
    emptyDescription = `No ${activeTab} subjects for this department yet.`;
  } else {
    emptyDescription = `No ${activeTab} subjects found for this school year.`;
  }

  return (
    <>
      {activeTab === "minor" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Minor subjects can be shared to courses, strands, or levels within
            their department.
          </span>
        </div>
      )}
      <DataTable
        columns={columns}
        data={subjects}
        isLoading={isLoading}
        emptyTitle={`No ${activeTab} subjects found`}
        emptyDescription={emptyDescription}
      />
    </>
  );
}