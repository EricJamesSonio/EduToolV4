"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShareSubject } from "@/hooks/admin/useSubject";
import { programApi } from "@/api/admin/program.api";
import { courseApi } from "@/api/admin/course.api";
import { levelApi } from "@/api/admin/level.api";
import type { Subject, SubjectSharing } from "@/types/admin/subject.types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  // Track newly checked targets in this session
  const [pendingTargets, setPendingTargets] = useState<Set<string>>(new Set());

  // Fetch courses, levels scoped to the subject's program
  const programId = subject.realProgramId;

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["admin", "courses", programId, schoolYearId],
    queryFn: () => courseApi.getAll({ programId: programId!, schoolYearId }),
    enabled: !!programId && open,
  });

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", programId, schoolYearId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
    enabled: open,
  });

  const isLoading = coursesLoading || levelsLoading;

  // Build the set of already-shared target IDs for quick lookup
  const alreadySharedIds = new Set<string>([
    ...existingSharings.map((s) => s.courseId).filter(Boolean) as string[],
    ...existingSharings.map((s) => s.strandId).filter(Boolean) as string[],
    ...existingSharings.map((s) => s.levelId).filter(Boolean) as string[],
  ]);

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

  const handleConfirm = async () => {
    if (pendingTargets.size === 0) {
      onClose();
      return;
    }

    // Build share requests for each newly checked target
    const allTargets: ShareTarget[] = [
      ...courses.map((c) => ({ type: "course" as const, id: c.id, name: c.name })),
      ...levels.map((l) => ({ type: "level" as const, id: l.id, name: l.name })),
    ];

    const toShare = allTargets.filter((t) => pendingTargets.has(t.id));

    let successCount = 0;
    for (const target of toShare) {
      try {
        await shareMutation.mutateAsync({
          id: subject.id,
          data: {
            courseId: target.type === "course" ? target.id : undefined,
            levelId:  target.type === "level"  ? target.id : undefined,
          },
        });
        successCount++;
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(
          `Failed to share to ${target.name}: ${axiosErr?.response?.data?.message ?? "Unknown error"}`,
        );
      }
    }

    if (successCount > 0) {
      toast.success(
        `Shared to ${successCount} ${successCount === 1 ? "target" : "targets"}.`,
      );
    }

    setPendingTargets(new Set());
    onClose();
  };

  const handleClose = () => {
    setPendingTargets(new Set());
    onClose();
  };

  const hasPending = pendingTargets.size > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share "{subject.title}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <p className="text-sm text-muted-foreground">
            Select courses or levels within this program to share this minor subject with.
            Already-shared targets are shown as disabled.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {/* Courses */}
              {courses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Courses
                  </p>
                  {courses.map((course) => {
                    const alreadyShared = alreadySharedIds.has(course.id);
                    const isPending     = pendingTargets.has(course.id);
                    return (
                      <div
                        key={course.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={alreadyShared || isPending}
                            disabled={alreadyShared}
                            onCheckedChange={() => toggleTarget(course.id)}
                          />
                          <Label
                            htmlFor={`course-${course.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {course.name}
                          </Label>
                        </div>
                        {alreadyShared && (
                          <Badge variant="secondary" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Levels */}
              {levels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Levels
                  </p>
                  {levels.map((level) => {
                    const alreadyShared = alreadySharedIds.has(level.id);
                    const isPending     = pendingTargets.has(level.id);
                    return (
                      <div
                        key={level.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`level-${level.id}`}
                            checked={alreadyShared || isPending}
                            disabled={alreadyShared}
                            onCheckedChange={() => toggleTarget(level.id)}
                          />
                          <Label
                            htmlFor={`level-${level.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {level.name}
                          </Label>
                        </div>
                        {alreadyShared && (
                          <Badge variant="secondary" className="text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {courses.length === 0 && levels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No courses or levels found for this program.
                </p>
              )}
            </div>
          )}

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
              disabled={shareMutation.isPending || (!hasPending && !isLoading)}
            >
              {shareMutation.isPending
                ? "Sharing..."
                : hasPending
                  ? `Share to ${pendingTargets.size} ${pendingTargets.size === 1 ? "target" : "targets"}`
                  : "Done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}