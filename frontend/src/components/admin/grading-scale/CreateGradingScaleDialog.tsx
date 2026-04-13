"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import { programApi } from "@/api/admin/program.api"; // CHANGED from levelApi → programApi
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { GradeRange } from "@/types/admin/grading-scale.types";
import type { Program } from "@/types/admin/program.types";
import {
  GradingScaleRangeEditor,
  validateRanges,
} from "./GradingScaleRangeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const DEFAULT_RANGES: GradeRange[] = [
  {
    minPercent: 0,
    maxPercent: 74,
    gradeValue: "5.00",
    remark: "Failed",
    isPassing: false,
  },
  {
    minPercent: 74,
    maxPercent: 100,
    gradeValue: "1.00",
    remark: "Excellent",
    isPassing: true,
  },
];

interface FormValues {
  name: string;
  schoolYearId: string;
  programId: string; // CHANGED from levelId → programId
}

interface CreateGradingScaleDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGradingScaleDialog({
  open,
  onClose,
}: CreateGradingScaleDialogProps) {
  const queryClient = useQueryClient();
  const [ranges, setRanges] = useState<GradeRange[]>(DEFAULT_RANGES);
  const [rangeErrors, setRangeErrors] = useState<
    ReturnType<typeof validateRanges>
  >([]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", schoolYearId: "", programId: "" }, // CHANGED
  });

  const schoolYearId = watch("schoolYearId");
  const programId = watch("programId"); // CHANGED from levelId → programId

  useEffect(() => {
    if (!open) {
      reset();
      setRanges(DEFAULT_RANGES);
      setRangeErrors([]);
      setSubmitted(false);
    }
  }, [open, reset]);

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
    enabled: open,
  });

  // CHANGED: Fetch programs instead of levels
  const { data: programs = [] } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn: () => programApi.getAll(schoolYearId!),
    enabled: open && !!schoolYearId,
  });

  // CHANGED: Reset programId when schoolYearId changes
  useEffect(() => {
    setValue("programId", "");
  }, [schoolYearId, setValue]);

  const mutation = useMutation({
    mutationFn: gradingScaleApi.create,
    onSuccess: () => {
      toast.success("Grading scale created.");
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to create grading scale."
      );
    },
  });

  const onSubmit = (values: FormValues) => {
    setSubmitted(true);
    const errs = validateRanges(ranges);
    setRangeErrors(errs);
    if (errs.length > 0) return;

    mutation.mutate({
      name: values.name,
      schoolYearId: values.schoolYearId,
      programId: values.programId, // CHANGED from levelId → programId
      ranges,
    });
  };

  const handleRangesChange = (next: GradeRange[]) => {
    setRanges(next);
    if (submitted) setRangeErrors(validateRanges(next));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Grading Scale</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Scale Name</Label>
            <Input
              placeholder="e.g. Standard Grading Scale"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* School Year + Program — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>School Year</Label>
              <Select
                value={schoolYearId}
                onValueChange={(v) => setValue("schoolYearId", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.id}>
                      {sy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!schoolYearId && submitted && (
                <p className="text-xs text-destructive">
                  School year is required.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Program</Label> {/* CHANGED from "Level" */}
              <Select
                value={programId}
                onValueChange={(v) => setValue("programId", v ?? "")}
                disabled={!schoolYearId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      schoolYearId
                        ? "Select program" // CHANGED
                        : "Select school year first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p: Program) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!programId && submitted && (
                <p className="text-xs text-destructive">
                  Program is required.
                </p>
              )}
            </div>
          </div>

          {/* Range Editor */}
          <div className="space-y-2">
            <Label>Grade Ranges</Label>
            <div className="rounded-md border p-4">
              <GradingScaleRangeEditor
                ranges={ranges}
                onChange={handleRangesChange}
                errors={rangeErrors}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Scale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}