"use client";

import { useMemo, useState } from "react";
import { BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { classApi } from "@/api/admin/class.api";
import { useCreateClassAssignmentRequest } from "@/hooks/admin/useClassAssignmentRequest";

interface Props {
  open: boolean;
  onClose: () => void;
  studentSchoolYearId: string;
  origin: "student_request" | "admin_flag";
  schoolYearId?: string;
  sectionId?: string | null;
  studentId?: string;
}

export function RequestSubjectsDialog({ open, onClose, studentSchoolYearId, origin, schoolYearId, sectionId, studentId }: Props): React.JSX.Element {
  const create = useCreateClassAssignmentRequest();
  const isAdminFlag = origin === "admin_flag";
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: classesRaw, isLoading: classesLoading } = useAsyncQuery(
    ["admin", "available-classes", schoolYearId, sectionId, studentId] as unknown as readonly unknown[],
    () =>
      studentId
        ? classApi.getEligibleForStudent(studentId).then((all) => {
            // Filter to requested schoolYear/section when provided (eligible is already placement-aware)
            let filtered: typeof all = [...all];
            if (schoolYearId) filtered = filtered.filter((c) => (c as unknown as { schoolYearId: string }).schoolYearId === schoolYearId);
            if (sectionId) filtered = filtered.filter((c) => (c as unknown as { sectionId: string | null }).sectionId === sectionId);
            return filtered;
          })
        : classApi.getAll({ schoolYearId: schoolYearId ?? undefined, sectionId: sectionId ?? undefined } as never),
    { enabled: open && !isAdminFlag && !!schoolYearId },
  );

  const availableClasses = useMemo(() => {
    const arr = (classesRaw as unknown as { data?: unknown[] } | unknown[]) as unknown;
    if (Array.isArray(arr)) return arr as { id: string; subjectName?: string; subjectId?: string; subject?: { id: string; name: string } }[];
    const inner = (arr as Record<string, unknown>)?.data;
    if (Array.isArray(inner)) return inner as never[];
    const maybe = classesRaw as unknown as { data?: { id: string; subjectName?: string }[] };
    return maybe?.data ?? [];
  }, [classesRaw]);

  const handleToggle = (classId: string) => {
    const next = new Set(selected);
    if (next.has(classId)) next.delete(classId);
    else next.add(classId);
    setSelected(next);
  };

  const handleCreate = () => {
    if (isAdminFlag) {
      create.mutate(
        { studentSchoolYearId, origin, studentRequestedSubjectIds: undefined },
        {
          onSuccess: () => {
            toast.success("Student flagged for review");
            onClose();
          },
          onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed"),
        },
      );
      return;
    }

    // student_request: must select at least one, but not all
    if (selected.size === 0) {
      toast.error("Select at least one subject to request");
      return;
    }
    if (availableClasses.length > 0 && selected.size === availableClasses.length) {
      toast.info("No need for request — you selected all available subjects, which means you have no issue.");
      return;
    }

    const subjectIds = availableClasses
      .filter((c) => selected.has(c.id))
      .map((c) => (c as unknown as { subjectId?: string; subject?: { id: string } }).subjectId ?? (c as unknown as { subject?: { id: string } }).subject?.id)
      .filter(Boolean) as string[];
    const unique = Array.from(new Set(subjectIds));

    if (unique.length === 0) {
      toast.error("Could not resolve subjects for selected classes");
      return;
    }

    create.mutate(
      { studentSchoolYearId, origin, studentRequestedSubjectIds: unique },
      {
        onSuccess: () => {
          toast.success("Request submitted — admin will review");
          setSelected(new Set());
          onClose();
        },
        onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed"),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={origin === "student_request" ? "Request Subjects to Take" : "Flag for Review"} size="sm">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {origin === "student_request"
            ? "Select only the subjects you want to take from those available where you are enrolled. Admin will review your selection."
            : "Flag this student for manual review. You will select the subjects they can take on the review page."}
        </p>

        {isAdminFlag ? (
          <p className="text-xs text-muted-foreground">No subject selection needed now — you will pick available classes on the review page.</p>
        ) : classesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : availableClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No available classes found for your current enrollment. Please contact admin.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {availableClasses.map((cls) => {
              const subjectName = (cls as unknown as { subjectName?: string; subject?: { name: string } }).subjectName ?? (cls as unknown as { subject?: { name: string } }).subject?.name ?? cls.id.slice(0, 8);
              const checked = selected.has(cls.id);
              const hasWarning = !!(cls as unknown as { has_prerequisite_warning?: boolean }).has_prerequisite_warning;
              const warnings = (cls as unknown as { prerequisite_warnings?: Array<{ subject_name: string }> }).prerequisite_warnings ?? [];
              return (
                <label key={cls.id} className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"}`}>
                  <div className="flex items-center gap-3 w-full">
                    <Checkbox checked={checked} onCheckedChange={() => handleToggle(cls.id)} />
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium flex-1">{subjectName}</span>
                    {hasWarning && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 text-amber-700 bg-amber-50 shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        Prereq
                      </Badge>
                    )}
                  </div>
                  {hasWarning && warnings.length > 0 && (
                    <p className="text-xs text-amber-700 ml-8 leading-snug">Not yet passed: {warnings.map((w) => w.subject_name).join(", ")}</p>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} disabled={create.isPending || (!isAdminFlag && selected.size === 0)}>
          {isAdminFlag ? "Flag" : "Submit Request"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
