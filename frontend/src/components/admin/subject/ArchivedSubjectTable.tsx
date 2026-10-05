import { DataTable } from "@/components/shared/DataTable";
import { useArchivedSubjectColumns } from "@/components/admin/subject/ArchivedSubjectColumns";
import type { Subject } from "@/types/admin/subject.types";

interface ArchivedSubjectTableProps {
  isLoading: boolean;
  subjects: Subject[];
  onRestoreClick: (subject: Subject) => void;
}

/**
 * Read-only list of archived subjects. Archived subjects are hidden from new
 * classes but kept for existing records; restoring one fails if an active
 * subject has taken its name.
 */
export function ArchivedSubjectTable({
  isLoading,
  subjects,
  onRestoreClick,
}: ArchivedSubjectTableProps) {
  const columns = useArchivedSubjectColumns(onRestoreClick);

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Archived subjects stay attached to their existing classes, transcripts
          and grades. Restore one to use it for new classes again.
        </span>
      </div>
      <DataTable
        columns={columns}
        data={subjects}
        isLoading={isLoading}
        emptyTitle="No archived subjects"
        emptyDescription="Subjects used by a class are archived instead of deleted, and appear here."
      />
    </>
  );
}
