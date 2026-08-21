"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";

import { classApi } from "@/api/admin/class.api";
import type { CreateClassRequest, ScheduleSlot } from "@/api/admin/class.api";

import { Modal } from "@/components/shared/Modal";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ScheduleSlotFields } from "./ScheduleSlotFields";
import { useCreateClassData } from "./hooks/useCreateClassData";
import { SemesterTemplateWarning } from "./SemesterTemplateWarning";
import type { CreateClassForm, CreateClassDialogProps } from "./CreateClassDialog.types";
import { EMPTY_DEFAULTS } from "./CreateClassDialog.types";
import {
  loadClassDraft,
  clearClassDraft,
  saveClassDraft,
} from "@/components/admin/class/hooks//useClassDraft";

export function CreateClassDialog({
  open,
  onClose,
  defaultSubjectId,
  schoolYearId,
  schoolYearName,
    defaultProgramId,
  defaultSemesterId,
  defaultTrackId,
  defaultLevelId,
  defaultSectionId,
}: CreateClassDialogProps): React.JSX.Element {
  const router      = useRouter();

  const rawDraft = loadClassDraft();
  // A defaultProgramId only ever arrives from an active preset (page.tsx only
  // passes it when presetActive is true). If a preset is active, it wins
  // outright — the existing draft is not read for this session at all.
  const presetActive = !!defaultProgramId;
  const draft    = presetActive ? null : rawDraft;
  const hasDraft = !presetActive && !!rawDraft && Object.keys(rawDraft).length > 0;

  const methods = useForm<CreateClassForm>({
    defaultValues: {
      ...EMPTY_DEFAULTS,
        // Preset only applies when there's no in-progress draft to restore —
      // a draft represents unsaved work and always wins.
      ...(!hasDraft
        ? {
            programId:  defaultProgramId  ?? EMPTY_DEFAULTS.programId,
            semesterId: defaultSemesterId ?? EMPTY_DEFAULTS.semesterId,
            trackId:    defaultTrackId    ?? EMPTY_DEFAULTS.trackId,
            levelId:    defaultLevelId    ?? EMPTY_DEFAULTS.levelId,
            sectionId:  defaultSectionId  ?? EMPTY_DEFAULTS.sectionId,
          }
       : {}),
      ...draft,
      subjectId: defaultSubjectId ?? draft?.subjectId ?? "",
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

  const formValues = watch();
  useEffect(() => { saveClassDraft(formValues); }, [formValues]);

  const selectedProgramId  = formValues.programId;
  const selectedSemesterId = formValues.semesterId;
  const selectedTrackId    = formValues.trackId;
  const selectedLevelId    = formValues.levelId;
  const selectedSectionId  = formValues.sectionId;
  const selectedSubjectId  = formValues.subjectId;
  const selectedEducatorId = formValues.educatorId;

  const {
    programs, tracks, hasTrack, isCourseTrack, levels, sections, subjects,
    programMissingTemplate, semesters, educators, educatorClasses, educatorClassesLoading,
  } = useCreateClassData(
    schoolYearId,
    selectedProgramId,
    selectedSemesterId,
    selectedTrackId,
    selectedLevelId,
    selectedEducatorId,
    open,
  );

  // ── Schedule conflict gating ───────────────────────────────────────────────
  // ScheduleSlotFields reports whether any currently-entered slot overlaps the
  // selected educator's existing schedules; while true, submission is blocked
  // so backend conflicts are prevented up front rather than surfaced as errors.
  const [scheduleConflicts, setScheduleConflicts] = useState(false);
  const handleScheduleConflictsChange = useCallback((hasConflict: boolean) => {
    setScheduleConflicts(hasConflict);
  }, []);
  useEffect(() => {
    if (open) setScheduleConflicts(false);
  }, [open]);

  // ── Cascade resets ──────────────────────────────────────────────────────────
  // Fire only when a field changes after mount (user action). A plain
  // useRef(true) "skip first run" guard is not StrictMode-safe: dev mode runs
  // effects twice on mount, so the second pass would wipe pre-filled preset
  // values. Tracking the previous value instead only resets on real changes.

  const prevProgramId = useRef(selectedProgramId);
   useEffect(() => {
    if (prevProgramId.current === selectedProgramId) return;
    prevProgramId.current = selectedProgramId;
     setValue("semesterId", "");
     setValue("trackId",   "");
     setValue("levelId",   "");
     setValue("sectionId", "");
     setValue("subjectId", "");
   }, [selectedProgramId, setValue]);

  const prevTrackId = useRef(selectedTrackId);
   useEffect(() => {
    if (prevTrackId.current === selectedTrackId) return;
    prevTrackId.current = selectedTrackId;
     setValue("levelId",   "");
     setValue("sectionId", "");
     setValue("subjectId", "");
   }, [selectedTrackId, setValue]);

  const prevLevelId = useRef(selectedLevelId);
   useEffect(() => {
    if (prevLevelId.current === selectedLevelId) return;
    prevLevelId.current = selectedLevelId;
     setValue("sectionId", "");
     setValue("subjectId", "");
   }, [selectedLevelId, setValue]);

  const prevSectionId = useRef(selectedSectionId);
   useEffect(() => {
    if (prevSectionId.current === selectedSectionId) return;
    prevSectionId.current = selectedSectionId;
     setValue("subjectId", "");
   }, [selectedSectionId, setValue]);

  const mutation = useMutationWithInvalidation(
    (values: CreateClassForm) => {
      const payload: CreateClassRequest = {
        subjectId:    values.subjectId,
        educatorId:   values.educatorId,
        sectionId:    values.sectionId || undefined,
        schoolYearId: schoolYearId!,
        semesterId:   values.semesterId || undefined,
        capacity:     Number(values.capacity),
        schedules:    values.schedules.map((s) => ({
          weekday:   Number(s.weekday),
          startTime: s.startTime,
          endTime:   s.endTime,
        })) as ScheduleSlot[],
      };
      return classApi.create(payload);
    },
    {
      invalidateKeys: [queryKeys.admin.classes.all],
      onSuccess: () => {
        toast.success("Class created.");
        clearClassDraft();
        reset(EMPTY_DEFAULTS);
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to create class.");
      },
    },
  );

  function handleClose(): void {
    onClose();
  }

  function handleDiscard(): void {
    clearClassDraft();
    reset(EMPTY_DEFAULTS);
    onClose();
  }

  const isSubmitDisabled =
    mutation.isPending        ||
    scheduleConflicts        ||
    !selectedProgramId        ||
    programMissingTemplate    ||
    !selectedSemesterId       ||
    (hasTrack && !selectedTrackId) ||
    !selectedLevelId          ||
    !selectedSectionId        ||
    !selectedSubjectId        ||
    !selectedEducatorId       ||
    formValues.schedules.length === 0;

  return (
    <Modal open={open} onClose={handleClose} title={
          <span className="flex items-center gap-2">
            New Class
            {hasDraft && (
              <Badge variant="secondary" className="text-xs font-normal">
                Draft restored
              </Badge>
            )}
            {presetActive && (
              <Badge variant="secondary" className="text-xs font-normal">
                Preset applied
              </Badge>
            )}
          </span> 
        } size="lg">

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">

            <div className="space-y-1.5">
              <Label>School Year</Label>
              <Input
                value={schoolYearName ?? schoolYearId ?? "No school year selected"}
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(v) => setValue("programId", v ?? "")}
                disabled={!schoolYearId}
              >
                <SelectTrigger>
                  <span>
                    {programs.find((p) => p.id === selectedProgramId)?.name ?? "Select department"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {programMissingTemplate && <SemesterTemplateWarning onDiscard={() => { handleDiscard(); router.push("/admin/semester-settings"); }} />}

            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select
                value={selectedSemesterId}
                onValueChange={(v) => setValue("semesterId", v ?? "")}
                disabled={!selectedProgramId || programMissingTemplate}
              >
                <SelectTrigger>
                  <span>
                    {!selectedProgramId
                      ? "Select a department first"
                      : programMissingTemplate
                        ? "No template assigned"
                        : semesters.length === 0
                          ? "No semesters available"
                          : (semesters.find((s) => s.id === selectedSemesterId)?.name ?? "Select semester")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {semesters.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No semesters for this department
                    </div>
                  ) : (
                    semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex flex-col">
                          <span>{s.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(s.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {hasTrack && (
              <div className="space-y-1.5">
                <Label>{isCourseTrack ? "Course" : "Strand"}</Label>
                <Select
                  value={selectedTrackId}
                  onValueChange={(v) => setValue("trackId", v ?? "")}
                  disabled={!selectedProgramId || !selectedSemesterId || programMissingTemplate}
                >
                  <SelectTrigger>
                    <span>
                      {!selectedSemesterId
                        ? "Select a semester first"
                        : tracks.find((t) => t.id === selectedTrackId)?.name ??
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

            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={(v) => setValue("levelId", v ?? "")}
                disabled={
                  !selectedProgramId ||
                  programMissingTemplate ||
                  !selectedSemesterId ||
                  (hasTrack && !selectedTrackId)
                }
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

            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select
                value={selectedSectionId}
                onValueChange={(v) => setValue("sectionId", v ?? "")}
                disabled={!selectedLevelId || !selectedSemesterId || programMissingTemplate}
              >
                <SelectTrigger>
                  <span>
                    {sections.find((s) => s.id === selectedSectionId)?.name ?? "Select section"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {sections.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No sections for this level
                    </div>
                  ) : (
                    sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(v) => setValue("subjectId", v ?? "")}
                disabled={!selectedLevelId || !selectedSemesterId || programMissingTemplate}
              >
                <SelectTrigger>
                  <span>
                    {!selectedLevelId
                      ? "Select a level first"
                      : (subjects.find((s) => s.id === selectedSubjectId)?.title ??
                          "Select subject")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No subjects for this level
                    </div>
                  ) : (
                    subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Educator</Label>
              <Select
                value={selectedEducatorId}
                onValueChange={(v) => setValue("educatorId", v ?? "")}
                disabled={programMissingTemplate}
              >
                <SelectTrigger>
                  <span>
                    {educators.find((e) => e.id === selectedEducatorId)?.fullName ??
                      "Select educator"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {educators.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No educators available
                    </div>
                  ) : (
                    educators.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input
                type="number"
                min={1}
                disabled={programMissingTemplate}
                {...register("capacity", {
                  required: "Capacity is required",
                  min: { value: 1, message: "At least 1" },
                })}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            <ScheduleSlotFields
              educatorClasses={educatorClasses}
              isLoading={educatorClassesLoading}
              onConflictsChange={handleScheduleConflictsChange}
            />

            {scheduleConflicts && (
              <p className="text-xs text-destructive mt-1">
                Schedule conflict detected. The class cannot be created due to overlapping educator schedules.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDiscard}
                disabled={mutation.isPending}
              >
                Discard
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Save & Close
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                {mutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </FormProvider>
    </Modal>
  );
}
