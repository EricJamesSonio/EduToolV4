"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Check, BookOpen } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useEducatorClasses } from "@/hooks/educator/useEducatorClasses";

import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api";
import { subjectApi } from "@/api/admin/subject.api";
import { sectionApi } from "@/api/admin/section.api";
import { schoolYearApi } from "@/api/admin/school-year.api";

import { toArray } from "@/utils/classes.utils";

import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { EducatorClass } from "@/types/educator/class.types";
import type { AxiosError } from "axios";

interface EnrichedClass extends EducatorClass {
  subjectName: string | null;
  sectionName: string | null;
}

interface ApplyToClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheme: GradingSchemeTemplate | null;
}

export function ApplyToClassDialog({
  open,
  onOpenChange,
  scheme,
}: ApplyToClassDialogProps) {
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const { data: classesRaw, isLoading: classesLoading } =
    useEducatorClasses();

  const { data: subjectsRaw } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectApi.getAll(),
  });

  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });

  // ================= ACTIVE SCHOOL YEAR =================
  const activeSchoolYearId = useMemo(() => {
    const arr = toArray<{ id: string; status: string }>(schoolYearsRaw);
    return arr.find((sy) => sy.status === "active")?.id ?? null;
  }, [schoolYearsRaw]);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["sections", activeSchoolYearId],
    queryFn: () => sectionApi.getAll(activeSchoolYearId!),
    enabled: !!activeSchoolYearId,
  });

  // ================= MAPS =================
  const subjectMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; title: string }>(subjectsRaw).forEach((s) =>
      m.set(s.id, s.title)
    );
    return m;
  }, [subjectsRaw]);

  const sectionMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string }>(sectionsRaw).forEach((s) =>
      m.set(s.id, s.name)
    );
    return m;
  }, [sectionsRaw]);

  // ================= ENRICH CLASSES =================
  const classes = useMemo<EnrichedClass[]>(() => {
    return toArray<EducatorClass>(classesRaw).map((cls) => ({
      ...cls,
      subjectName: subjectMap.get(cls.subject_id) ?? null,
      sectionName: cls.section_id
        ? sectionMap.get(cls.section_id) ?? null
        : null,
    }));
  }, [classesRaw, subjectMap, sectionMap]);

  // ================= APPLY =================
  const handleApply = async () => {
    if (!scheme || !selectedClassId) return;

    setIsApplying(true);

    try {
      await educatorGradingSchemeApi.applyTemplateToClass({
        classId: selectedClassId,
        templateId: scheme.id,
        name: scheme.name,
      });

      // ================= CACHE INVALIDATION =================
      queryClient.invalidateQueries({
        queryKey: ["grading-scheme", "class", selectedClassId],
      });

      queryClient.invalidateQueries({
        queryKey: ["grading-scheme"],
      });

      toast.success(`"${scheme.name}" applied to class.`);

      onOpenChange(false);
      setSelectedClassId(null);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;

      toast.error(
        axiosErr?.response?.data?.message ??
          "Failed to apply grading scheme."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (isApplying) return;
    if (!o) setSelectedClassId(null);
    onOpenChange(o);
  };

  // ================= SAFETY GUARD =================
  if (!scheme) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Apply to Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select a class to apply{" "}
            <span className="font-medium text-foreground">
              "{scheme.name}"
            </span>
          </p>

          {classesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No classes found
              </p>
              <p className="text-xs text-muted-foreground">
                You have no active classes assigned.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-2">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    className={cn(
                      "w-full rounded-md border px-4 py-3 text-left transition-colors",
                      "hover:bg-muted/50",
                      selectedClassId === cls.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {cls.subjectName ?? cls.subject_id}
                        </p>
                        {cls.sectionName && (
                          <p className="text-xs text-muted-foreground">
                            {cls.sectionName}
                          </p>
                        )}
                      </div>

                      {selectedClassId === cls.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>

          <Button
            disabled={!selectedClassId || isApplying}
            onClick={handleApply}
          >
            {isApplying ? "Applying..." : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}