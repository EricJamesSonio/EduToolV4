// frontend\src\components\admin\enrollment\program-view\AssignSectionDialog.tsx
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import type { AxiosError } from "axios";
import { sectionApi } from "@/api/admin/section.api";
import { useUpdateProgramEnrollment } from "@/hooks/admin/useStudentEnrollment";
import { Button }   from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Section } from "@/types/admin/section.types";
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
} from "@/types/admin/student-enrollment.types";

interface AssignSectionDialogProps {
  open:                boolean;
  onClose:             () => void;
  enrollment:          StudentSchoolYearEnrollment;
  programEnrollment:   ProgramEnrollmentSnapshot;
  schoolYearId:        string;
  isEnded:             boolean;
}

export function AssignSectionDialog({
  open,
  onClose,
  programEnrollment,
  schoolYearId,
  isEnded,
}: AssignSectionDialogProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    programEnrollment.section?.id ?? "",
  );

  const levelId  = programEnrollment.level?.id;
  const courseId = programEnrollment.course?.id ?? null;
  const strandId = programEnrollment.strand?.id ?? null;

  const { data: allSections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["admin", "sections", schoolYearId, levelId],
    queryFn:  () => sectionApi.getAll(schoolYearId, levelId),
    enabled:  open && !!levelId,
  });

  const sections = allSections.filter((s: Section) => {
    if (courseId) return s.course_id === courseId;
    if (strandId) return s.strand_id === strandId;
    return s.course_id === null && s.strand_id === null;
  });

  const updateMutation = useUpdateProgramEnrollment(schoolYearId);

  const handleSave = () => {
    if (!selectedSectionId) return;
    updateMutation.mutate(
      { programEnrollmentId: programEnrollment.id, data: { section_id: selectedSectionId } },
      {
        onSuccess: () => { toast.success("Section assigned."); onClose(); },
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to assign section.");
        },
      },
    );
  };

  const handleRemove = () => {
    updateMutation.mutate(
      { programEnrollmentId: programEnrollment.id, data: { section_id: null } },
      {
        onSuccess: () => { toast.success("Section removed."); onClose(); },
        onError:   () => toast.error("Failed to remove section."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Assign Section
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 mt-1">
          <p className="text-xs text-muted-foreground">
            {programEnrollment.level?.name ?? "—"}
            {programEnrollment.course && ` · ${programEnrollment.course.code ?? programEnrollment.course.name}`}
            {programEnrollment.strand && ` · ${programEnrollment.strand.name}`}
          </p>

          {sectionsLoading ? (
            <Skeleton className="h-9 w-full rounded-md" />
          ) : sections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No sections available for this scope.
            </p>
          ) : (
<Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
  <SelectTrigger className="h-9 text-sm">
    <SelectValue placeholder="Select a section">
      {/* ↓ resolve id → name explicitly */}
      {sections.find((s) => s.id === selectedSectionId)?.name ?? "Select a section"}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {sections.map((sec) => (
      <SelectItem key={sec.id} value={sec.id}>
        {sec.name}
        <span className="ml-2 text-xs text-muted-foreground">
          cap. {sec.capacity}
          {sec.studentCount !== undefined && ` · ${sec.studentCount} enrolled`}
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {programEnrollment.section && !isEnded && (
            <button
              onClick={handleRemove}
              disabled={updateMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              Remove section
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedSectionId || sections.length === 0 || updateMutation.isPending || isEnded}
            >
              {updateMutation.isPending ? "Saving..." : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}