// frontend/src/components/admin/class/CreateClassDialog.tsx

"use client";

import { useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { classApi }    from "@/api/admin/class.api";
import type { CreateClassRequest, ScheduleSlot } from "@/api/admin/class.api";
import { subjectApi }  from "@/api/admin/subject.api";
import { educatorApi } from "@/api/admin/educator.api";
import { programApi }  from "@/api/admin/program.api";
import { courseApi }   from "@/api/admin/course.api";
import { strandApi }   from "@/api/admin/strand.api";
import { levelApi }    from "@/api/admin/level.api";
import { sectionApi }  from "@/api/admin/section.api";

import type { Level }   from "@/types/admin/level.types";
import type { Subject } from "@/types/admin/subject.types";

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
} from "@/components/ui/select";
import { ScheduleSlotFields } from "./ScheduleSlotFields";
import { toArray } from "@/utils/classes.utils";

export interface ScheduleSlotForm {
  weekday:   string;
  startTime: string;
  endTime:   string;
}

export interface CreateClassForm {
  programId:  string;
  trackId:    string;
  levelId:    string;
  sectionId:  string;
  subjectId:  string;
  educatorId: string;
  capacity:   string;
  schedules:  ScheduleSlotForm[];
}

interface CreateClassDialogProps {
  open:            boolean;
  onClose:         () => void;
  defaultSubjectId?: string;
  schoolYearId:    string | null;
  schoolYearName:  string | null;
}

export function CreateClassDialog({
  open,
  onClose,
  defaultSubjectId,
  schoolYearId,
  schoolYearName,
}: CreateClassDialogProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const methods = useForm<CreateClassForm>({
    defaultValues: {
      programId:  "",
      trackId:    "",
      levelId:    "",
      sectionId:  "",
      subjectId:  defaultSubjectId ?? "",
      educatorId: "",
      capacity:   "30",
      schedules:  [{ weekday: "1", startTime: "08:00", endTime: "09:00" }],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const selectedProgramId  = watch("programId");
  const selectedTrackId    = watch("trackId");
  const selectedLevelId    = watch("levelId");
  const selectedSectionId  = watch("sectionId");
  const selectedSubjectId  = watch("subjectId");
  const selectedEducatorId = watch("educatorId");

  const { data: programsRaw } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId!),
    enabled:  !!schoolYearId,
  });
  const programs = toArray<{ id: string; name: string }>(programsRaw);

  const { data: coursesRaw } = useQuery({
    queryKey: ["admin", "courses", schoolYearId, selectedProgramId],
    queryFn:  () => courseApi.getAll({ schoolYearId: schoolYearId!, programId: selectedProgramId! }),
    enabled:  !!schoolYearId && !!selectedProgramId,
  });

  const { data: strandsRaw } = useQuery({
    queryKey: ["admin", "strands", selectedProgramId],
    queryFn:  () => strandApi.getAll({ program_id: selectedProgramId! }),
    enabled:  !!selectedProgramId,
  });

  const courses       = toArray<{ id: string; name: string }>(coursesRaw);
  const strands       = toArray<{ id: string; name: string }>(strandsRaw);
  const tracks        = courses.length > 0 ? courses : strands;
  const hasTrack      = tracks.length > 0;
  const isCourseTrack = courses.length > 0;

  const { data: levelsRaw } = useQuery({
    queryKey: ["admin", "levels", "school-year", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId!),
    enabled:  !!schoolYearId,
  });

  const levels = useMemo<Level[]>(() => {
    const all = toArray<Level>(levelsRaw);
    if (!selectedProgramId) return [];
    return all.filter((l) => l.program_id === selectedProgramId);
  }, [levelsRaw, selectedProgramId]);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections", schoolYearId, selectedLevelId],
    queryFn:  () => sectionApi.getAll(schoolYearId!, selectedLevelId!),
    enabled:  !!schoolYearId && !!selectedLevelId,
  });
  const sections = toArray<{ id: string; name: string }>(sectionsRaw);

const { data: subjectsRaw } = useQuery({
  queryKey: [
    "admin",
    "subjects",
    selectedLevelId,
    isCourseTrack ? selectedTrackId : undefined,
    !isCourseTrack ? selectedTrackId : undefined,
  ],
  queryFn: () => subjectApi.getAll({
    levelId: selectedLevelId!,
    ...(selectedTrackId && isCourseTrack  ? { courseId: selectedTrackId } : {}),
    ...(selectedTrackId && !isCourseTrack ? { strandId: selectedTrackId } : {}),
  }),
  enabled: !!selectedLevelId,
});

  const subjects = toArray<Subject>(subjectsRaw);

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn:  () => educatorApi.getAll(),
  });
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  // cascade resets
  useEffect(() => {
    setValue("trackId", ""); setValue("levelId", "");
    setValue("sectionId", ""); setValue("subjectId", "");
  }, [selectedProgramId, setValue]);

  useEffect(() => {
    setValue("levelId", ""); setValue("sectionId", ""); setValue("subjectId", "");
  }, [selectedTrackId, setValue]);

  useEffect(() => {
    setValue("sectionId", ""); setValue("subjectId", "");
  }, [selectedLevelId, setValue]);

  useEffect(() => {
    setValue("subjectId", "");
  }, [selectedSectionId, setValue]);

  const mutation = useMutation({
    mutationFn: (values: CreateClassForm) => {
      const payload: CreateClassRequest = {
        subjectId:    values.subjectId,
        educatorId:   values.educatorId,
        sectionId:    values.sectionId || undefined,
        schoolYearId: schoolYearId!,
        capacity:     Number(values.capacity),
        schedules:    values.schedules.map((s) => ({
          weekday:   Number(s.weekday),
          startTime: s.startTime,
          endTime:   s.endTime,
        })) as ScheduleSlot[],
      };
      return classApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Class created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to create class.");
    },
  });

  function handleClose() { reset(); onClose(); }

  const isSubmitDisabled =
    mutation.isPending        ||
    !selectedProgramId        ||
    (hasTrack && !selectedTrackId) ||
    !selectedLevelId          ||
    !selectedSectionId        ||
    !selectedSubjectId        ||
    !selectedEducatorId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Class</DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 mt-1"
          >
            {/* School Year — read-only */}
            <div className="space-y-1.5">
              <Label>School Year</Label>
              <Input
                value={schoolYearName ?? schoolYearId ?? "No school year selected"}
                disabled
              />
            </div>

            {/* Program */}
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(v) => setValue("programId", v ?? "")}
                disabled={!schoolYearId}
              >
                <SelectTrigger>
                  <span>
                    {programs.find((p) => p.id === selectedProgramId)?.name ?? "Select program"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course / Strand */}
            {hasTrack && (
              <div className="space-y-1.5">
                <Label>{isCourseTrack ? "Course" : "Strand"}</Label>
                <Select
                  value={selectedTrackId}
                  onValueChange={(v) => setValue("trackId", v ?? "")}
                  disabled={!selectedProgramId}
                >
                  <SelectTrigger>
                    <span>
                      {tracks.find((t) => t.id === selectedTrackId)?.name ??
                        `Select ${isCourseTrack ? "course" : "strand"}`}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Level */}
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={(v) => setValue("levelId", v ?? "")}
                disabled={!selectedProgramId || (hasTrack && !selectedTrackId)}
              >
                <SelectTrigger>
                  <span>
                    {levels.find((l) => l.id === selectedLevelId)?.name ?? "Select level"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {levels.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No levels found</div>
                  ) : (
                    levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select
                value={selectedSectionId}
                onValueChange={(v) => setValue("sectionId", v ?? "")}
                disabled={!selectedLevelId}
              >
                <SelectTrigger>
                  <span>
                    {sections.find((s) => s.id === selectedSectionId)?.name ?? "Select section"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {sections.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No sections for this level</div>
                  ) : (
                    sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(v) => setValue("subjectId", v ?? "")}
                disabled={!selectedLevelId}
              >
                <SelectTrigger>
                  <span>
                    {!selectedLevelId
                      ? "Select a level first"
                      : (subjects.find((s) => s.id === selectedSubjectId)?.title ?? "Select subject")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No subjects for this level</div>
                  ) : (
                    subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Educator */}
            <div className="space-y-1.5">
              <Label>Educator</Label>
              <Select
                value={selectedEducatorId}
                onValueChange={(v) => setValue("educatorId", v ?? "")}
              >
                <SelectTrigger>
                  <span>
                    {educators.find((e) => e.id === selectedEducatorId)?.fullName ?? "Select educator"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {educators.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Capacity */}
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input
                type="number"
                min={1}
                {...register("capacity", {
                  required: "Capacity is required",
                  min: { value: 1, message: "At least 1" },
                })}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            {/* Schedule */}
            <ScheduleSlotFields />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                {mutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}