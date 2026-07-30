"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import type { Student } from "@/types/admin/student.types";
import type { EnrollStudentProgramRequest } from "@/types/admin/student-enrollment.types";
import { Modal } from "@/components/shared/Modal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

interface FormValues {
  program_id: string;
  level_id: string;
  course_id: string;
  strand_id: string;
  section_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student;
  schoolYearId: string;
  onConfirm: (data: EnrollStudentProgramRequest) => void;
  isLoading: boolean;
}

export function ProgramEnrollmentDialog({
  open,
  onClose,
  student,
  schoolYearId,
  onConfirm,
  isLoading,
}: Props) {
  const { watch, setValue, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      program_id: "",
      level_id: "",
      course_id: "",
      strand_id: "",
      section_id: "",
    },
  });

  const programId = watch("program_id");
  const levelId = watch("level_id");

  useEffect(() => {
    setValue("level_id", "");
    setValue("course_id", "");
    setValue("strand_id", "");
    setValue("section_id", "");
  }, [programId, setValue]);

  useEffect(() => {
    setValue("section_id", "");
  }, [levelId, setValue]);

  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId),
    { enabled: open && !!schoolYearId },
  );

  const selectedProgram = programs.find((p) => p.id === programId);
  const programType = selectedProgram?.type ?? "";

  const isCollege = programType === "college";
  const isShs = programType === "shs";
  const hasLevels = ["daycare", "kinder", "elementary", "jhs"].includes(programType);

  const { data: levels = [] } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId }),
    () => levelApi.getBySchoolYear(schoolYearId),
    { enabled: open && !!schoolYearId },
  );

  const programLevels = levels.filter((l) => (l as { program_id?: string }).program_id === programId);

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = (values: FormValues) => {
    if (!values.program_id) return;
    onConfirm({
      program_id: values.program_id,
      level_id: values.level_id || undefined,
      course_id: values.course_id || undefined,
      strand_id: values.strand_id || undefined,
      section_id: values.section_id || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Assign Program
        </span>
      }
      description={
        <>
          Assigning program for{" "}
          <span className="font-medium text-foreground">{student.fullName}</span>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Program <span className="text-destructive">*</span></Label>
            <Select
              value={watch("program_id")}
              onValueChange={(v) => setValue("program_id", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasLevels && programId && (
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={watch("level_id")}
                onValueChange={(v) => setValue("level_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {programLevels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isCollege && programId && (
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select
                value={watch("course_id")}
                onValueChange={(v) => setValue("course_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {(selectedProgram?.courses ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code ? `${c.code} – ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isShs && programId && (
            <div className="space-y-1.5">
              <Label>Strand</Label>
              <Select
                value={watch("strand_id")}
                onValueChange={(v) => setValue("strand_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {(selectedProgram?.strands ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!programId || isLoading}>
              {isLoading ? "Saving..." : "Assign Program"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}