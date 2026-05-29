// ===== File: frontend\src\components\admin\subject\SubjectDialog.tsx =====
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { CreateSubjectRequest, UpdateSubjectRequest } from "@/api/admin/subject.api";
import type { Subject, SubjectType } from "@/types/admin/subject.types";
import type { Level } from "@/types/admin/level.types";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import { Modal } from "@/components/shared/Modal";
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
  const queryClient = useQueryClient();
  const [duplicateWarning, setDuplicateWarning] = useState<Subject | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
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
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["admin", "subjects", "all", schoolYearId],
    queryFn: () => subjectApi.getAll({ schoolYearId: schoolYearId! }),
    enabled: !!schoolYearId && !isEdit,
  });

  // Fetch programs first
  const { data: programs = [] } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn: () => programApi.getAll(schoolYearId!),
    enabled: !!schoolYearId && !isEdit,
  });

  // Then detect program type
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const programType = selectedProgram?.type ?? "";
  const hasCourses = programType === "college";
  const hasStrands = programType === "shs";

  // Fetch levels scoped to course or strand when selected
  const { data: courseLevels = [] } = useQuery({
    queryKey: ["admin", "levels", "course", schoolYearId, selectedCourseId],
    queryFn:  () => levelApi.getByCourse(schoolYearId!, selectedCourseId),
    enabled:  !!schoolYearId && hasCourses && !!selectedCourseId,
  });

  const { data: strandLevels = [] } = useQuery({
    queryKey: ["admin", "levels", "strand", schoolYearId, selectedStrandId],
    queryFn:  () => levelApi.getByStrand(schoolYearId!, selectedStrandId),
    enabled:  !!schoolYearId && hasStrands && !!selectedStrandId,
  });

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
        : levels.filter((l) => l.program_id === selectedProgramId);

  const mutation = useMutation({
    mutationFn: (values: SubjectFormValues) => {
      const payload: CreateSubjectRequest | UpdateSubjectRequest = {
        name: values.name,
        subjectType: values.subjectType,
        programId: values.programId || undefined,
        levelId: isMinor ? values.levelId || undefined : values.levelId,
        courseId: values.courseId || undefined,
        strandId: values.strandId || undefined,
      };
      return isEdit
        ? subjectApi.update(subject!.id, payload as UpdateSubjectRequest)
        : subjectApi.create(payload as CreateSubjectRequest);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Subject updated." : "Subject created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save subject.");
    },
  });

  const handleClose = () => {
    reset({
      name: "",
      programId: defaultProgramId ?? "",
      levelId: defaultLevelId ?? "",
      courseId: defaultCourseId ?? "",
      strandId: defaultStrandId ?? "",
      subjectType: defaultSubjectType,
    });
    setDuplicateWarning(null);
    onClose();
  };

  const handleFormSubmit = (values: SubjectFormValues) => {
    const duplicate = checkDuplicateSubject(values);
    if (duplicate) {
      setDuplicateWarning(duplicate);
    } else {
      mutation.mutate(values);
    }
  };

  const handleConfirmCreate = () => {
    if (duplicateWarning) {
      const formValues = getValues();
      mutation.mutate(formValues);
      setDuplicateWarning(null);
    }
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
    (!isEdit && !selectedProgramId) ||
    (!isEdit && !selectedLevelId && !isMinor) ||
    (isMajorCollege && !selectedCourseId) ||
    (isMajorSHS && !selectedStrandId) ||
    (isMinorSubject && !selectedLevelId);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Subject" : "New Subject"}
      size="md"
    >

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
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

          {/* Program — create only, always shown */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Program</Label>
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
                  <SelectValue placeholder="Select a program">
                    {programs.find((p) => p.id === selectedProgramId)?.name ??
                      "Select a program"}
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
                  Minor subjects can only be shared within this program.
                </p>
              )}
            </div>
          )}

          {/* Course — for College programs (before Level) */}
          {!isEdit && !isMinor && hasCourses && (
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
                  <SelectValue placeholder="Select a course" />
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
          {!isEdit && !isMinor && hasStrands && (
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
                  <SelectValue placeholder="Select a strand" />
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
            <Label>
              Level{" "}
              {isMinor && (
                <span className="text-muted-foreground font-normal">
                  (optional for minor)
                </span>
              )}
            </Label>
            <Select
              value={selectedLevelId}
              onValueChange={(v) => setValue("levelId", v ?? "")}
              disabled={!isEdit && !selectedProgramId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !isEdit && !selectedProgramId
                      ? "Select a program first"
                      : isEdit
                        ? "Select a level"
                        : hasCourses && !selectedCourseId
                          ? "Select a course first"
                          : hasStrands && !selectedStrandId
                            ? "Select a strand first"
                            : "Select a level"
                  }
                >
                  {!isEdit
                    ? filteredLevels.find((l) => l.id === selectedLevelId)?.name ??
                      (hasCourses && !selectedCourseId
                        ? "Select a course first"
                        : hasStrands && !selectedStrandId
                          ? "Select a strand first"
                          : "Select a level")
                    : levels.find((l) => l.id === selectedLevelId)?.name ?? "Select a level"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {isMinor && <SelectItem value="">— None —</SelectItem>}
                {(!isEdit ? filteredLevels : levels).map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
                {!isEdit && selectedProgramId && filteredLevels.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    {hasCourses && !selectedCourseId
                      ? "Select a course to see levels"
                      : hasStrands && !selectedStrandId
                        ? "Select a strand to see levels"
                        : "No levels for this program"}
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
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
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
            <Button type="submit" disabled={isSubmitDisabled}>
              {mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Subject"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}