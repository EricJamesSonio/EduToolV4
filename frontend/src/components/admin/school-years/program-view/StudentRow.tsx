// frontend\src\components\admin\enrollment\program-view\StudentRow.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LayoutGrid, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AssignSectionDialog } from "./AssignSectionDialog";
import { getProgramEnrollment } from "./enrollment.helpers";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";

interface StudentRowProps {
  enrollment:    StudentSchoolYearEnrollment;
  programId:     string;
  schoolYearId:  string;
  isEnded:       boolean;
  onUnenroll:    (enrollment: StudentSchoolYearEnrollment) => void;
  isUnenrolling: boolean;
  // ↓ pass the student's fullName from the parent so we display it
  studentName:   string;
}

export function StudentRow({
  enrollment,
  programId,
  schoolYearId,
  isEnded,
  onUnenroll,
  isUnenrolling,
  studentName,
}: StudentRowProps) {
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const router = useRouter();
  const pe = getProgramEnrollment(enrollment, programId);

  const handleView = () => {
    // Encode current path as ?back= so the detail page can return here
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/admin/students/${enrollment.student_id}?back=${back}`);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            {/* ↓ show fullName instead of student_id */}
            <p className="text-sm font-medium truncate">{studentName}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {pe?.level && (
                <span className="text-xs text-muted-foreground">{pe.level.name}</span>
              )}
              {pe?.course && (
                <Badge variant="outline" className="text-xs font-normal py-0 px-1.5">
                  {pe.course.code ?? pe.course.name}
                </Badge>
              )}
              {pe?.strand && (
                <Badge variant="outline" className="text-xs font-normal py-0 px-1.5">
                  {pe.strand.name}
                </Badge>
              )}
              {pe?.section ? (
                <Badge variant="secondary" className="text-xs font-normal py-0 px-1.5">
                  {pe.section.name}
                </Badge>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                  No section
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* View — always available */}
          <button
            onClick={handleView}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-primary/10 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </button>

          {!isEnded && (
            <>
              {pe?.level && (
                <button
                  onClick={() => setSectionDialogOpen(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                >
                  <LayoutGrid className="h-3 w-3" />
                  {pe.section ? "Change Section" : "Assign Section"}
                </button>
              )}
              <button
                onClick={() => onUnenroll(enrollment)}
                disabled={isUnenrolling}
                className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {sectionDialogOpen && pe && (
        <AssignSectionDialog
          open
          onClose={() => setSectionDialogOpen(false)}
          enrollment={enrollment}
          programEnrollment={pe}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
        />
      )}
    </>
  );
}