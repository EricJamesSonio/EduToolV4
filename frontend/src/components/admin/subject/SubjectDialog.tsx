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
 * Sentinel for the "use the program default" option in the count select.
 * Base UI items need a non-empty value, so Default is never "".
 */
const DEFAULT_OPTION = "default";
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
  /** Empty string = "use the program default". */
  sessionsPerWeek: string;
  /**
   * Session length as hours + minutes, e.g. 3h 0m = 180. Both empty means
   * "use the program default", which the API stores as null.
   */
  sessionHours: string;
  sessionMins: string;
}

/**
 * Converts stored session numbers (null = Default) into the form's string
 * fields. Used for edit mode and for the New Subject preset.
 */
function toSessionFields(
  perWeek: number | null | undefined,
  minutes: number | null | undefined,
): Pick<SubjectFormValues, "sessionsPerWeek" | "sessionHours" | "sessionMins"> {
  return {
    sessionsPerWeek: perWeek != null ? String(perWeek) : "",
    sessionHours: minutes != null ? String(Math.floor(minutes / 60)) : "",
    sessionMins: minutes != null ? String(minutes % 60) : "",
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
    // Empty means "use the program default", which the API stores as null.
    sessionsPerWeek: values.sessionsPerWeek
      ? Number(values.sessionsPerWeek)
      : null,
    // Hours + minutes collapse to one total; both empty stays Default.
    sessionMinutes:
      values.sessionHours === "" && values.sessionMins === ""
        ? null
        : (Number(values.sessionHours) || 0) * 60 +
          (Number(values.sessionMins) || 0),
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
  /** Create mode only (from the preset). null/undefined = Default. */
  defaultSessionsPerWeek?: number | null;
  /** Create mode only (from the preset). Total minutes; null/undefined = Default. */
  defaultSessionMinutes?: number | null;
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
        ? toSessionFields(subject.sessionsPerWeek, subject.sessionMinutes)
        : toSessionFields(defaultSessionsPerWeek, defaultSessionMinutes)),
    },
  });

  const { stepMin: slotMinutes } = useScheduleWindow();
  const sessionHoursRaw = watch("sessionHours");
  const sessionMinsRaw = watch("sessionMins");
  /** Total explicit length in minutes, or null when both fields are empty. */
  const sessionTotalMinutes =
    sessionHoursRaw === "" && sessionMinsRaw === ""
      ? null
      : (Number(sessionHoursRaw) || 0) * 60 + (Number(sessionMinsRaw) || 0);
  const sessionMisaligned =
    sessionTotalMinutes != null &&
    sessionTotalMinutes > 0 &&
    sessionTotalMinutes % slotMinutes !== 0;
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
      ...toSessionFields(defaultSessionsPerWeek, defaultSessionMinutes),
    });
    onClose();
  };

  const handleFormSubmit = (values: SubjectFormValues) => {
    const duplicate = checkDuplicateSubject(values);
    if (duplicate) {
      setError('name', { message: 'Subject already exists for this program and level.' });
      return;
    }
    // Validate the hours + minutes total up front so a doomed request never
    // leaves the dialog: the server caps at 480m and requires a multiple of
    // the school's slot length for anything explicit.
    if (values.sessionHours !== "" || values.sessionMins !== "") {
      const total =
        (Number(values.sessionHours) || 0) * 60 +
        (Number(values.sessionMins) || 0);
      if (total < 5) {
        setError('sessionMins', { message: 'Enter at least 5 minutes, or leave both empty for Default.' });
        return;
      }
      if (total > 480) {
        setError('sessionMins', { message: 'Session length cannot exceed 480 minutes (8h).' });
        return;
      }
      if (total % slotMinutes !== 0) {
        setError('sessionMins', { message: `${total}m is not a multiple of the school's ${slotMinutes}m slot length.` });
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
      size="md"
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

      {/* Weekly sessions — optional, falls back to the department default */}
      <div className="space-y-1.5">
        <Label>Weekly sessions</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={watch("sessionsPerWeek") || DEFAULT_OPTION}
            onValueChange={(v) =>
              setValue(
                "sessionsPerWeek",
                v === DEFAULT_OPTION ? "" : (v ?? ""),
                { shouldDirty: true },
              )
            }
            disabled={isLocked}
          >
            <SelectTrigger aria-label="Sessions per week">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_OPTION}>Default</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} per week
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            max={8}
            step={1}
            placeholder="Hours"
            aria-label="Session hours"
            disabled={isLocked}
            {...register("sessionHours", {
              validate: (v) =>
                v === "" || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 8)
                  ? true
                  : "0–8",
            })}
          />
          <Input
            type="number"
            min={0}
            max={59}
            step={1}
            placeholder="Minutes"
            aria-label="Session minutes"
            disabled={isLocked}
            {...register("sessionMins", {
              validate: (v) =>
                v === "" || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 59)
                  ? true
                  : "0–59",
            })}
          />
        </div>
        {isLocked ? (
          <p className="text-[11px] text-muted-foreground">
            This subject is locked — unlock it to change its weekly sessions.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Leave everything on Default to follow the department standard
            {subject?.effectiveSessionsPerWeek
              ? ` (currently ${subject.effectiveSessionsPerWeek} × ${subject.effectiveSessionMinutes}m)`
              : ""}
            . E.g. 3 hrs 0 min = 180 min. Length must be a multiple of the
            school&apos;s {slotMinutes}m slot.
            {sessionTotalMinutes != null && sessionTotalMinutes > 0
              ? ` Current: ${sessionTotalMinutes}m.`
              : ""}
          </p>
        )}
        {sessionMisaligned ? (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            {sessionTotalMinutes}m is not a multiple of the {slotMinutes}m slot
            and will be rejected on save.
          </p>
        ) : null}
        {errors.sessionHours ? (
          <p className="text-xs text-destructive">{errors.sessionHours.message}</p>
        ) : null}
        {errors.sessionMins ? (
          <p className="text-xs text-destructive">{errors.sessionMins.message}</p>
        ) : null}
      </div>

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