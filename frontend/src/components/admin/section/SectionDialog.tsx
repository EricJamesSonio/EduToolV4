"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { Program } from "@/types/admin/program.types";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";
import { buildLevelLabel, programNeedsSubGroup } from "@/components/admin/section/utils/section.utils";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AxiosError } from "axios";

interface SectionFormValues {
  programId:  string;
  courseId:   string;
  strandId:   string;
  levelId:    string;
  name:       string;
  capacity:   number;
}

interface SectionDialogProps {
  section?:     Section;
  levels:       EnrichedLevel[];
  programs:     Program[];
  schoolYearId: string;
  open:         boolean;
  onClose:      () => void;
  onSaved:      () => void;
}

export function SectionDialog({
  section,
  levels,
  programs,
  schoolYearId,
  open,
  onClose,
  onSaved,
}: SectionDialogProps): React.JSX.Element {
  const isEdit = !!section;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<SectionFormValues>({
      defaultValues: {
        programId: "",
        courseId:  "",
        strandId:  "",
        levelId:   section?.level_id ?? "",
        name:      section?.name     ?? "",
        capacity:  section?.capacity ?? 30,
      },
    });

  const selectedProgramId = watch("programId");
  const selectedCourseId  = watch("courseId");
  const selectedStrandId  = watch("strandId");
  const selectedLevelId   = watch("levelId");

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const needsSubGroup   = selectedProgram
    ? programNeedsSubGroup(selectedProgram.type)
    : false;

  // Levels filtered to the selected program
  const filteredLevels = useMemo(
    () => selectedProgramId
      ? levels.filter((l) => l.program_id === selectedProgramId)
      : [],
    [levels, selectedProgramId]
  );

  const selectedLevel = filteredLevels.find((l) => l.id === selectedLevelId);

  // For college: courses from the selected program
  const courses = selectedProgram?.courses ?? [];
  // For SHS: strands from the selected program
  const strands = selectedProgram?.strands ?? [];

  // Sub-group label for display
  const selectedSubGroupLabel = useMemo(() => {
    if (selectedProgram?.type === "college") {
      const c = courses.find((c) => c.id === selectedCourseId);
      return c ? (c.code ? `${c.code} – ${c.name}` : c.name) : null;
    }
    if (selectedProgram?.type === "shs") {
      const s = strands.find((s) => s.id === selectedStrandId);
      return s?.name ?? null;
    }
    return null;
  }, [selectedProgram, courses, strands, selectedCourseId, selectedStrandId]);

  // Whether the sub-group step is satisfied
  const subGroupSatisfied = !needsSubGroup ||
    (selectedProgram?.type === "college" ? !!selectedCourseId : !!selectedStrandId);

  const mutation = useMutation({
    mutationFn: (values: SectionFormValues) =>
      isEdit
        ? sectionApi.update(section!.id, {
            name:     values.name,
            capacity: values.capacity,
          })
        : sectionApi.create({
            levelId:      values.levelId,
            schoolYearId,
            courseId:     values.courseId  || undefined,
            strandId:     values.strandId  || undefined,
            name:         values.name,
            capacity:     values.capacity,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Section updated." : "Section created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save section.");
    },
  });

  function handleClose(): void {
    reset();
    onClose();
  }

  const canSubmit =
    !isEdit &&
    !!selectedProgramId &&
    subGroupSatisfied &&
    !!selectedLevelId;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Section" : "New Section"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          {/* ── Program (create only) ── */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(v) => {
                  setValue("programId", v ?? "");
                  setValue("courseId",  "");
                  setValue("strandId",  "");
                  setValue("levelId",   "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program">
                    {selectedProgram?.name ?? "Select a program"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Course (college only) ── */}
          {!isEdit && selectedProgram?.type === "college" && (
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select
                value={selectedCourseId}
                onValueChange={(v) => {
                  setValue("courseId", v ?? "");
                  setValue("levelId",  "");
                }}
                disabled={!selectedProgramId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course">
                    {selectedSubGroupLabel ?? "Select a course"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No courses for this program
                    </div>
                  ) : (
                    courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code ? `${c.code} – ${c.name}` : c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Strand (SHS only) ── */}
          {!isEdit && selectedProgram?.type === "shs" && (
            <div className="space-y-1.5">
              <Label>Strand</Label>
              <Select
                value={selectedStrandId}
                onValueChange={(v) => {
                  setValue("strandId", v ?? "");
                  setValue("levelId",  "");
                }}
                disabled={!selectedProgramId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a strand">
                    {selectedSubGroupLabel ?? "Select a strand"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {strands.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No strands for this program
                    </div>
                  ) : (
                    strands.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Level (create only, gated on program + sub-group if needed) ── */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={(v) => setValue("levelId", v ?? "")}
                disabled={!selectedProgramId || !subGroupSatisfied}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedProgramId
                        ? "Select a program first"
                        : needsSubGroup && !subGroupSatisfied
                        ? selectedProgram?.type === "college"
                          ? "Select a course first"
                          : "Select a strand first"
                        : "Select a level"
                    }
                  >
                    {selectedLevel
                      ? selectedLevel.name
                      : !selectedProgramId
                      ? "Select a program first"
                      : needsSubGroup && !subGroupSatisfied
                      ? selectedProgram?.type === "college"
                        ? "Select a course first"
                        : "Select a strand first"
                      : "Select a level"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredLevels.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No levels for this program
                    </div>
                  ) : (
                    filteredLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Name ── */}
          <div className="space-y-1.5">
            <Label>Section Name</Label>
            <Input
              placeholder="e.g. Section A, Rizal, Mabini"
              {...register("name", {
                required:  "Name is required",
                minLength: { value: 1,   message: "At least 1 character" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* ── Capacity ── */}
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 40"
              {...register("capacity", {
                required:      "Capacity is required",
                min:           { value: 1, message: "At least 1 student" },
                valueAsNumber: true,
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (!isEdit && !canSubmit)}
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}