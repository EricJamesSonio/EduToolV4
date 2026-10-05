"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { CreateSubjectRequest, UpdateSubjectRequest } from "@/api/admin/subject.api";
import type { Subject, SubjectType } from "@/types/admin/subject.types";
import type { Level } from "@/types/admin/level.types";
import { programApi } from "@/api/admin/program.api";

import { levelApi } from "@/api/admin/level.api";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";

/**
 * Sentinel for the "use the department standard" option lives in
 * WeeklySessionsSection so the dialog and the preset agree on it.
 */
import {
  WeeklySessionsSection,
  MIN_SESSION_MINUTES,
  MAX_SESSION_MINUTES,
  type WeeklySessionDraft,
} from "@/components/admin/subject/WeeklySessionsSection";
import { DialogForm } from "@/components/shared/DialogForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { AxiosError } from "axios";

interface SubjectFormValues {
  name: string;
  programId: string;
  levelId: string;
  courseId: string;
  strandId: string;
  subjectType: SubjectType;
  /** Empty string = "use the department standard". */
  sessionsPerWeek: string;
  /**
   * Length of EACH weekly session in minutes, in order. Empty means uniform
   * (every session uses `sessionMinutes`), which is what a default subject and
   * a plain "same time every session" subject both store.
   */
  sessionDurations: number[];
}

/**
 * Builds the per-session draft the shared WeeklySessionsSection edits.
 *
 * Stored `sessionDurations` are authoritative for an explicit subject. For a
 * default subject the resolved values are passed through ONLY so the section
 * can DISPLAY them read-only — nothing here is written back unless the user
 * switches to a custom schedule.
 */
export function toWeeklySessionDraft(
  values: Pick<SubjectFormValues, "sessionsPerWeek" | "sessionDurations">,
  resolvedDurations: number[],
  uniformMinutes: number | null,
): WeeklySessionDraft {
  const count = values.sessionsPerWeek
    ? Number(values.sessionsPerWeek)
    : resolvedDurations.length;
  const rows = values.sessionDurations.length
    ? values.sessionDurations
    : Array.from({ length: count }, () => uniformMinutes ?? 60);
  const uniform =
    rows.length > 0 && rows.every((d) => d === rows[0]) ? rows[0] : null;
  return {
    sessionsPerWeek: values.sessionsPerWeek,
    sessionDurations: rows,
    uniformMinutes: uniform,
    // Keyed off the STORED values, not the expanded `rows` (which are always
    // non-empty because they fall back to the standard for display). A subject
    // with nothing explicit stored has not been touched and must not become
    // explicit merely by opening the form.
    touched: values.sessionsPerWeek !== "" || values.sessionDurations.length > 0,
  };
}

/**
 * Turns the section draft back into form values.
 *
 * A draft that is still identical to the department standard is NOT written as
 * explicit — switching to a custom schedule is the only thing that makes a
 * subject explicit, so simply opening and saving the dialog leaves a default
 * subject on the default.
 */
export function applyWeeklySessionDraft(
  draft: WeeklySessionDraft,
  resolvedCount: number,
  resolvedBaseMinutes: number,
): Pick<SubjectFormValues, "sessionsPerWeek" | "sessionDurations"> {
  // Untouched AND numerically equal to the standard = still following it.
  // Touching the control is what makes the subject explicit, even when the
  // chosen numbers happen to coincide with the standard.
  const rows = draft.sessionDurations.length
    ? draft.sessionDurations
    : Array.from({ length: resolvedCount }, () => resolvedBaseMinutes);
  const sameAsStandard =
    draft.sessionsPerWeek === "" ||
    Number(draft.sessionsPerWeek) === resolvedCount;
  if (!draft.touched && sameAsStandard) {
    return { sessionsPerWeek: "", sessionDurations: [] };
  }
  const count = draft.sessionsPerWeek ? Number(draft.sessionsPerWeek) : resolvedCount;
  return {
    sessionsPerWeek: draft.sessionsPerWeek || String(count),
    sessionDurations: rows,
  };
}

/**
 * Builds the create/update payload from form values.
 *
 * In edit mode an unchanged name is omitted: legacy/seeded names may contain
 * characters the current name rule rejects (e.g. "/" in
 * "CS Thesis / Capstone Project"), and resending them would 400 a save that
 * never touched the name. An actual rename is still sent and validated.
 */
export function buildSubjectPayload(
  values: SubjectFormValues,
  subject?: Subject,
): CreateSubjectRequest | UpdateSubjectRequest {
  const isEdit = !!subject;
  const nameChanged =
    !isEdit || values.name.trim() !== (subject?.title ?? "").trim();
  return {
    ...(nameChanged ? { name: values.name } : {}),
    subjectType: values.subjectType,
    programId: values.programId || undefined,
    // When editing, empty selections clear the previous department-scoped
    // course/strand/level so a subject can be moved cleanly across programs.
    levelId: values.levelId || (isEdit ? null : undefined),
    courseId: values.courseId || (isEdit ? null : undefined),
    strandId: values.strandId || (isEdit ? null : undefined),
    // Empty means "use the department standard", which the API stores as null.
    sessionsPerWeek: values.sessionsPerWeek
      ? Number(values.sessionsPerWeek)
      : null,
    /**
     * `sessionMinutes` stays the BASE so the existing consumers keep working.
     * When every session is the same length it is that length; with mixed
     * lengths it is the first, and `sessionDurations` is authoritative.
     */
    sessionMinutes: values.sessionDurations.length
      ? (values.sessionDurations[0] ?? null)
      : null,
    // Empty means uniform: every session uses sessionMinutes. The service
    // rejects a non-empty list whose length disagrees with sessionsPerWeek.
    sessionDurations: values.sessionDurations,
  };
}

interface SubjectDialogProps {
  subject?: Subject;
  levels: Level[];
  schoolYearId?: string;
  defaultSubjectType?: SubjectType;
  defaultProgramId?: string;
  defaultCourseId?: string;
  defaultStrandId?: string;
  defaultLevelId?: string;
  /** Create mode only (from the preset). null/undefined = department standard. */
  defaultSessionsPerWeek?: number | null;
  /** Create mode only (from the preset). Total minutes; null/undefined = standard. */
  defaultSessionMinutes?: number | null;
  /** Create mode only (from the preset). Per-session lengths; empty = uniform. */
  defaultSessionDurations?: number[] | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SubjectDialog({
  subject,
  levels,
  schoolYearId,
  defaultSubjectType = "major",
  defaultProgramId,
  defaultCourseId,
  defaultStrandId,
  defaultLevelId,
  defaultSessionsPerWeek,
  defaultSessionMinutes,
  defaultSessionDurations,
  open,
  onClose,
  onSaved,
}: SubjectDialogProps): React.JSX.Element {
  const isEdit = !!subject;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    defaultValues: {
      name: subject?.title ?? "",
      programId: subject?.realProgramId ?? defaultProgramId ?? "",
      levelId: subject?.levelId ?? defaultLevelId ?? "",
      courseId: subject?.courseId ?? defaultCourseId ?? "",
      strandId: subject?.strandId ?? defaultStrandId ?? "",
      subjectType: (subject?.subjectType ?? defaultSubjectType) as SubjectType,
      ...(subject
        ? {
            sessionsPerWeek:
              subject.sessionsPerWeek != null
                ? String(subject.sessionsPerWeek)
                : "",
            sessionDurations: subject.sessionDurations ?? [],
          }
        : {
            sessionsPerWeek:
              defaultSessionsPerWeek != null
                ? String(defaultSessionsPerWeek)
                : "",
            sessionDurations:
              defaultSessionDurations?.length
                ? defaultSessionDurations
                : defaultSessionMinutes != null
                  ? [defaultSessionMinutes]
                  : [],
          }),
    },
  });

  const { stepMin: slotMinutes } = useScheduleWindow();
  const draftSessionsPerWeek = watch("sessionsPerWeek");
  const draftDurations = watch("sessionDurations");
  /** True when the subject has no explicit weekly requirement stored. */
  const isOnDefault =
    !subject || subject.sessionRequirementSource !== "explicit";
  /**
   * Resolved values shown when following the standard. For an explicit subject
   * these are its own values, so the section shows real data in both modes.
   */
  const resolvedCount = subject?.effectiveSessionsPerWeek ?? 5;
  const resolvedDurations = subject?.effectiveSessionDurations ?? [];
  const resolvedBaseMinutes = subject?.effectiveSessionMinutes ?? 60;

  const [weeklyDraft, setWeeklyDraft] = useState<WeeklySessionDraft>(() =>
    toWeeklySessionDraft(
      {
        sessionsPerWeek: draftSessionsPerWeek,
        sessionDurations: draftDurations,
      },
      subject?.effectiveSessionDurations?.length
        ? subject.effectiveSessionDurations
        : Array.from({ length: subject?.effectiveSessionsPerWeek ?? 5 }, () => subject?.effectiveSessionMinutes ?? 60),
      subject?.sessionMinutes ?? null,
    ),
  );
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  const onWeeklyChange = (next: WeeklySessionDraft): void => {
    setWeeklyDraft(next);
    setWeeklyError(null);
    setValue("sessionsPerWeek", next.sessionsPerWeek, { shouldDirty: true });
    setValue("sessionDurations", next.sessionDurations, { shouldDirty: true });
  };

  const isLocked = subject?.lockStatus === "locked";

  const selectedProgramId = watch("programId");
  const selectedLevelId = watch("levelId");
  const selectedCourseId = watch("courseId");
  const selectedStrandId = watch("strandId");
  const subjectName = watch("name");
  const subjectType = watch("subjectType");
  const isMinor = subjectType === "minor";

  // Fetch all subjects for duplicate checking
  const { data: allSubjects = [] } = useAsyncQuery(
    [...queryKeys.admin.subjects.all, 'all', schoolYearId] as const,
    () => subjectApi.getAll({ schoolYearId: schoolYearId! }),
    { enabled: !!schoolYearId && !isEdit },
  );

  // Fetch programs first (also in edit mode so subjects can be moved across departments)
  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  // In edit mode the parent may pass filter-scoped levels, so fetch the full
  // school-year set to allow reassigning to any department/level.
  const { data: allLevels = [] } = useAsyncQuery(
    [...queryKeys.admin.levels.all, 'all', schoolYearId] as const,
    () => levelApi.getBySchoolYear(schoolYearId!),
    { enabled: !!schoolYearId && isEdit },
  );

  const baseLevels = isEdit ? allLevels : levels;

  // Then detect program type
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const programType = selectedProgram?.type ?? "";
  const hasCourses = programType === "college";
  const hasStrands = programType === "shs";

  // Fetch levels scoped to course or strand when selected
  const { data: courseLevels = [] } = useAsyncQuery(
    [...queryKeys.admin.levels.all, 'course', schoolYearId, selectedCourseId] as const,
    () => levelApi.getByCourse(schoolYearId!, selectedCourseId),
    { enabled: !!schoolYearId && hasCourses && !!selectedCourseId },
  );

  const { data: strandLevels = [] } = useAsyncQuery(
    [...queryKeys.admin.levels.all, 'strand', schoolYearId, selectedStrandId] as const,
    () => levelApi.getByStrand(schoolYearId!, selectedStrandId),
    { enabled: !!schoolYearId && hasStrands && !!selectedStrandId },
  );

  const selectedLevelSource = hasCourses
    ? courseLevels
    : hasStrands
      ? strandLevels
      : [];

  const filteredLevels = !selectedProgramId
    ? []
    : hasCourses && selectedCourseId
      ? courseLevels
      : hasStrands && selectedStrandId
        ? strandLevels
        : baseLevels.filter((l) => l.program_id === selectedProgramId);

  const mutation = useMutationWithInvalidation(
    (values: SubjectFormValues) => {
      const payload = buildSubjectPayload(values, subject);
      return isEdit
        ? subjectApi.update(subject!.id, payload as UpdateSubjectRequest)
        : subjectApi.create(payload as CreateSubjectRequest);
    },
    {
      invalidateKeys: [queryKeys.admin.subjects.all],
      onSuccess: () => {
        toast.success(isEdit ? "Subject updated." : "Subject created.");
        onSaved();
        reset();
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to save subject.");
      },
    }
  );

  const handleClose = () => {
    reset({
      name: "",
      programId: defaultProgramId ?? "",
      levelId: defaultLevelId ?? "",
      courseId: defaultCourseId ?? "",
      strandId: defaultStrandId ?? "",
      subjectType: defaultSubjectType,
      sessionsPerWeek:
        defaultSessionsPerWeek != null ? String(defaultSessionsPerWeek) : "",
      sessionDurations: defaultSessionDurations?.length
        ? defaultSessionDurations
        : defaultSessionMinutes != null
          ? [defaultSessionMinutes]
          : [],
    });
    onClose();
  };

  const handleFormSubmit = (values: SubjectFormValues) => {
    const duplicate = checkDuplicateSubject(values);
    if (duplicate) {
      setError('name', { message: 'Subject already exists for this program and level.' });
      return;
    }
    // Validate every explicit session length up front so a doomed request never
    // leaves the dialog: the server caps at 480m, floors at 5m, and requires
    // every length to be a whole number of the school's slots.
    const explicitCount = values.sessionsPerWeek
      ? Number(values.sessionsPerWeek)
      : null;
    if (explicitCount && values.sessionDurations.length) {
      if (values.sessionDurations.length !== explicitCount) {
        setWeeklyError(
          `Supply one time per session (${explicitCount}), or use "Apply to all".`,
        );
        return;
      }
    }
    for (const minutes of values.sessionDurations) {
      if (minutes < MIN_SESSION_MINUTES) {
        setWeeklyError(
          "Enter at least 5 minutes per session, or switch back to the department standard.",
        );
        return;
      }
      if (minutes > MAX_SESSION_MINUTES) {
        setWeeklyError("Session length cannot exceed 480 minutes (8h).");
        return;
      }
      if (minutes % slotMinutes !== 0) {
        setWeeklyError(
          `${minutes}m is not a multiple of the school's ${slotMinutes}m slot length.`,
        );
        return;
      }
    }
    mutation.mutate(values);
  };

  const isMajorCollege = !isMinor && programType === "college";
  const isMajorSHS = !isMinor && programType === "shs";
  const isMinorSubject = isMinor;

  // Function to check for duplicate subjects
  const checkDuplicateSubject = (values: SubjectFormValues): Subject | null => {
    if (isEdit || !schoolYearId) return null;

    return allSubjects.find(existingSubject => {
      const nameMatch = existingSubject.title.toLowerCase() === values.name.toLowerCase().trim();
      const typeMatch = existingSubject.subjectType === values.subjectType;
      const programMatch = existingSubject.programId === values.programId;

      // For minor subjects, check level match (if level is specified)
      const levelMatch = isMinor
        ? (values.levelId ? existingSubject.levelId === values.levelId : true)
        : existingSubject.levelId === values.levelId;

      // For major subjects, check course/strand match
      const courseStrandMatch = !isMinor && programType === "college"
        ? existingSubject.courseId === values.courseId
        : !isMinor && programType === "shs"
          ? existingSubject.strandId === values.strandId
          : true;

      return nameMatch && typeMatch && programMatch && levelMatch && courseStrandMatch;
    }) || null;
  };

  const isSubmitDisabled =
    mutation.isPending ||
    !selectedProgramId ||
    (!selectedLevelId && !isMinor) ||
    (isMajorCollege && !selectedCourseId) ||
    (isMajorSHS && !selectedStrandId) ||
    (isMinorSubject && !selectedLevelId);

  return (
    <DialogForm
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Subject" : "New Subject"}
      size="3xl"
      onSubmit={handleSubmit(handleFormSubmit)}
      isSaving={mutation.isPending}
      saveLabel={isEdit ? "Save Changes" : "Create Subject"}
    >
      {/* Subject Type — create only */}
      {!isEdit && (
        <div className="space-y-1.5">
          <Label>Subject Type</Label>
          <Tabs
            value={subjectType}
            onValueChange={(v) => {
              setValue("subjectType", v as SubjectType);
              setValue("levelId", defaultLevelId ?? "");
              setValue("courseId", defaultCourseId ?? "");
              setValue("strandId", defaultStrandId ?? "");
            }}
          >
            <TabsList className="w-full h-9">
              <TabsTrigger value="major" className="flex-1 text-sm">
                Major
              </TabsTrigger>
              <TabsTrigger value="minor" className="flex-1 text-sm">
                Minor
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Weekly sessions — optional, only drives automated class generation */}
      <WeeklySessionsSection
        value={weeklyDraft}
        onChange={onWeeklyChange}
        slotMinutes={slotMinutes}
        resolvedCount={resolvedCount}
        resolvedDurations={
          resolvedDurations.length
            ? resolvedDurations
            : Array.from({ length: resolvedCount }, () => resolvedBaseMinutes)
        }
        isOnDefault={isOnDefault}
        disabled={isLocked}
        error={isLocked ? "This subject is locked — unlock it to change its weekly sessions." : weeklyError ?? undefined}
      />

      {/* Department — always shown (create + edit) */}
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Select
          value={selectedProgramId}
          onValueChange={(v) => {
            setValue("programId", v ?? "");
            setValue("levelId", "");
            setValue("courseId", "");
            setValue("strandId", "");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a department">
              {programs.find((p) => p.id === selectedProgramId)?.name ??
                "Select a department"}
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
        {isMinor && (
          <p className="text-xs text-muted-foreground">
            Minor subjects can only be shared within this department.
          </p>
        )}
      </div>

      {/* Course — for College programs (before Level) */}
      {!isMinor && hasCourses && (
        <div className="space-y-1.5">
          <Label>
            Course <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCourseId}
            onValueChange={(v) => {
              setValue("courseId", v ?? "");
              setValue("levelId", "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course">
                {programs.find((p) => p.id === selectedProgramId)?.courses?.find((c) => c.id === selectedCourseId)?.name ?? "Select a course"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {programs
                .find((p) => p.id === selectedProgramId)
                ?.courses?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.courseId && (
            <p className="text-xs text-destructive">{errors.courseId.message}</p>
          )}
        </div>
      )}

      {/* Strand — for SHS programs (before Level) */}
      {!isMinor && hasStrands && (
        <div className="space-y-1.5">
          <Label>
            Strand <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedStrandId}
            onValueChange={(v) => {
              setValue("strandId", v ?? "");
              setValue("levelId", "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a strand">
                {programs.find((p) => p.id === selectedProgramId)?.strands?.find((s) => s.id === selectedStrandId)?.name ?? "Select a strand"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {programs
                .find((p) => p.id === selectedProgramId)
                ?.strands?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.strandId && (
            <p className="text-xs text-destructive">{errors.strandId.message}</p>
          )}
        </div>
      )}

      {/* Level — now comes AFTER course/strand, filtered by course/strand */}
      <div className="space-y-1.5">
        <Label>Level</Label>
        <Select
          value={selectedLevelId}
          onValueChange={(v) => setValue("levelId", v ?? "")}
          disabled={!selectedProgramId}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !selectedProgramId
                  ? "Select a department first"
                  : hasCourses && !selectedCourseId
                    ? "Select a course first"
                    : hasStrands && !selectedStrandId
                      ? "Select a strand first"
                      : "Select a level"
              }
            >
              {filteredLevels.find((l) => l.id === selectedLevelId)?.name ??
                (!selectedProgramId
                  ? "Select a department first"
                  : hasCourses && !selectedCourseId
                    ? "Select a course first"
                    : hasStrands && !selectedStrandId
                      ? "Select a strand first"
                      : "Select a level")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {isMinor && <SelectItem value="">— None —</SelectItem>}
            {filteredLevels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
            {selectedProgramId && filteredLevels.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                {hasCourses && !selectedCourseId
                  ? "Select a course to see levels"
                  : hasStrands && !selectedStrandId
                    ? "Select a strand to see levels"
                    : "No levels for this department"}
              </div>
            )}
          </SelectContent>
        </Select>
        {errors.levelId && (
          <p className="text-xs text-destructive">{errors.levelId.message}</p>
        )}
      </div>

      {/* Subject Name */}
      <div className="space-y-1.5">
        <Label>Subject Name</Label>
        <Input
          placeholder="e.g. Mathematics, English, Science"
          {...register("name", {
            required: "Name is required",
            minLength: { value: 1, message: "At least 1 character" },
            maxLength: { value: 100, message: "Max 100 characters" },
          })}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
    </DialogForm>
  );
}