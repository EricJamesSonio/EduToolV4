"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradeRange, GradingScale } from "@/types/admin/grading-scale.types";
import { PROGRAM_TYPE_VALUES, PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import type { ProgramType } from "@/types/admin/program.types";
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
    minPercent: 75,
    maxPercent: 100,
    gradeValue: "1.00",
    remark: "Excellent",
    isPassing: true,
  },
];

interface FormValues {
  name: string;
  programType: string;
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
    defaultValues: { name: "", programType: "" },
  });

  const programType = watch("programType");

  useEffect(() => {
    if (!open) {
      reset();
      setRanges(DEFAULT_RANGES);
      setRangeErrors([]);
      setSubmitted(false);
    }
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data: { name: string; programType: string; ranges: GradeRange[] }) =>
      gradingScaleApi.create(data),
    onSuccess: () => {
      toast.success("Grading scale created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "gradingScales"] });
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
      programType: values.programType,
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

          {/* Program Type */}
          <div className="space-y-1.5">
            <Label>Department Type</Label>
            <Select
              value={programType}
              onValueChange={(v) => setValue("programType", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department type" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TYPE_VALUES.map((pt) => (
                  <SelectItem key={pt} value={pt}>
                    {PROGRAM_TYPE_LABELS[pt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!programType && submitted && (
              <p className="text-xs text-destructive">
                Department type is required.
              </p>
            )}
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
