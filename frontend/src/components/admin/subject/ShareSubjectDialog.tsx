"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShareSubject } from "@/hooks/admin/useSubject";
import { courseApi } from "@/api/admin/course.api";
import { levelApi } from "@/api/admin/level.api";
import { strandApi } from "@/api/admin/strand.api";
import type { Subject, SubjectSharing } from "@/types/admin/subject.types";
import type { Course } from "@/types/admin/course.types";
import type { Strand } from "@/types/admin/strand.types";
import type { Level } from "@/types/admin/level.types";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Share2 } from "lucide-react";
import type { AxiosError } from "axios";

interface ShareSubjectDialogProps {
  subject: Subject;
  existingSharings: SubjectSharing[];
  schoolYearId: string;
  open: boolean;
  onClose: () => void;
}

type ShareTarget =
  | { type: "course"; id: string; name: string }
  | { type: "strand"; id: string; name: string }
  | { type: "level"; id: string; name: string };

export function ShareSubjectDialog({
  subject,
  existingSharings,
  schoolYearId,
  open,
  onClose,
}: ShareSubjectDialogProps): React.JSX.Element {
  const shareMutation = useShareSubject();
  const [pendingTargets, setPendingTargets] = useState<Set<string>>(
    new Set()
  );

  // Extract subject properties
  const programId = subject.realProgramId;
  const subjectLevelId = subject.levelId;
  const programType = subject.programType; // "college" | "shs" | "daycare" | etc.

  // Determine program type
  const isCollege = programType === "college";
  const isSHS = programType === "shs";
  const isSimple = !isCollege && !isSHS;

  // Fetch courses — only for college programs
  // Courses API expects: { schoolYearId, programId? }
  const { data: allCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["admin", "courses", programId, schoolYearId],
    queryFn: () =>
      courseApi.getAll({ schoolYearId, programId: programId! }),
    enabled: !!programId && open && isCollege,
  });

  // Fetch strands — only for SHS programs
  // Strands API expects: { program_id? } (snake_case!)
  const { data: allStrands = [], isLoading: strandsLoading } = useQuery({
    queryKey: ["admin", "strands", programId, schoolYearId],
    queryFn: () =>
      strandApi.getAll({ program_id: programId! }),
    enabled: !!programId && open && isSHS,
  });

  // Fetch levels — only for simple programs
  const { data: allLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
    enabled: open && isSimple,
  });

  const isLoading = coursesLoading || strandsLoading || levelsLoading;

// Filter data based on program type
  // Courses and Strands are already filtered by program_id in the API query
  const courses: Course[] = isCollege ? allCourses : [];

  const strands: Strand[] = isSHS ? allStrands : [];

  const levelTargets: Level[] = isSimple
    ? allLevels.filter(
        (l: Level) =>
          l.id === subjectLevelId && l.program_id === programId
      )
    : [];

  // Track already-shared items
  const alreadySharedIds = new Set<string>([
    ...existingSharings
      .map((s) => s.courseId)
      .filter(Boolean) as string[],
    ...existingSharings
      .map((s) => s.strandId)
      .filter(Boolean) as string[],
    ...existingSharings
      .map((s) => s.levelId)
      .filter(Boolean) as string[],
  ]);

  // Toggle selection
  const toggleTarget = (id: string) => {
    setPendingTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle confirmation and share
  const handleConfirm = async () => {
    if (pendingTargets.size === 0) {
      onClose();
      return;
    }

    const allTargets: ShareTarget[] = [
      ...courses.map((c: Course) => ({
        type: "course" as const,
        id: c.id,
        name: c.name,
      })),
      ...strands.map((s: Strand) => ({
        type: "strand" as const,
        id: s.id,
        name: s.name,
      })),
      ...levelTargets.map((l: Level) => ({
        type: "level" as const,
        id: l.id,
        name: l.name,
      })),
    ];

    const toShare = allTargets.filter((t) => pendingTargets.has(t.id));

    let successCount = 0;

    for (const target of toShare) {
      try {
        await shareMutation.mutateAsync({
          id: subject.id,
          data: {
            courseId:
              target.type === "course" ? target.id : undefined,
            strandId:
              target.type === "strand" ? target.id : undefined,
            levelId: target.type === "level" ? target.id : undefined,
          },
        });
        successCount++;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(
          `Failed to share to ${target.name}: ${
            axiosErr?.response?.data?.message ?? "Unknown error"
          }`
        );
      }
    }

    if (successCount > 0) {
      toast.success(
        `Shared to ${successCount} ${
          successCount === 1 ? "target" : "targets"
        }.`
      );
    }

    setPendingTargets(new Set());
    onClose();
  };

  // Handle dialog close
  const handleClose = () => {
    setPendingTargets(new Set());
    onClose();
  };

  // Render individual item
  const renderItem = (id: string, name: string) => {
    const alreadyShared = alreadySharedIds.has(id);
    const isPending = pendingTargets.has(id);

    return (
      <div
        key={id}
        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
      >
        <div className="flex items-center gap-2.5">
          <Checkbox
            id={id}
            checked={alreadyShared || isPending}
            disabled={alreadyShared}
            onCheckedChange={() => toggleTarget(id)}
          />
          <Label
            htmlFor={id}
            className="text-sm font-normal cursor-pointer"
          >
            {name}
          </Label>
        </div>
        {alreadyShared && (
          <Badge variant="secondary" className="text-xs">
            Shared
          </Badge>
        )}
      </div>
    );
  };

  // Check if there are any targets to display
  const hasTargets =
    courses.length > 0 || strands.length > 0 || levelTargets.length > 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        <span className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share &quot;{subject.title}&quot;
        </span>
      }
      size="md"
    >

        <div className="space-y-4 mt-1">
          {/* Description based on program type */}
          <p className="text-sm text-muted-foreground">
            {isCollege &&
              "Showing courses within the same program."}
            {isSHS &&
              "Showing strands within the same program."}
            {isSimple &&
              "Showing the level this subject belongs to."}
          </p>

          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-9 w-full rounded-md"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {/* Courses section — college only */}
              {courses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Courses
                  </p>
                  {courses.map((c: Course) =>
                    renderItem(c.id, c.name)
                  )}
                </div>
              )}

              {/* Strands section — SHS only */}
              {strands.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Strands
                  </p>
                  {strands.map((s: Strand) =>
                    renderItem(s.id, s.name)
                  )}
                </div>
              )}

              {/* Levels section — simple programs only */}
              {levelTargets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Level
                  </p>
                  {levelTargets.map((l: Level) =>
                    renderItem(l.id, l.name)
                  )}
                </div>
              )}

              {/* No targets message */}
              {!hasTargets && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No eligible targets found. Ensure courses or
                  strands exist under this program and level.
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={shareMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={
                shareMutation.isPending ||
                (!pendingTargets.size && !isLoading)
              }
            >
              {shareMutation.isPending
                ? "Sharing..."
                : pendingTargets.size
                  ? `Share to ${pendingTargets.size} ${
                      pendingTargets.size === 1
                        ? "target"
                        : "targets"
                    }`
                  : "Done"}
            </Button>
          </div>
        </div>
    </Modal>
  );
}