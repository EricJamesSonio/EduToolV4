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
    },
  });

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
      const payload: CreateSubjectRequest | UpdateSubjectRequest = {
        name: values.name,
        subjectType: values.subjectType,
        programId: values.programId || undefined,
        // When editing, empty selections clear the previous department-scoped
        // course/strand/level so a subject can be moved cleanly across programs.
        levelId: values.levelId || (isEdit ? null : undefined),
        courseId: values.courseId || (isEdit ? null : undefined),
        strandId: values.strandId || (isEdit ? null : undefined),
      };
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
    });
    onClose();
  };

  const handleFormSubmit = (values: SubjectFormValues) => {
    const duplicate = checkDuplicateSubject(values);
    if (duplicate) {
      setError('name', { message: 'Subject already exists for this program and level.' });
      return;
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
