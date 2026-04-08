"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useUpdateProgram } from "@/hooks/admin/useProgram";
import { mapToApiProgramType } from "@/utils/programType.mapper"; // ✅ IMPORT MAPPER

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { ProgramType } from "@/types/admin/program.types";

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare:    "Daycare",
  kinder:     "Kindergarten",
  elementary: "Elementary",
  jhs:        "Junior High School",
  shs:        "Senior High School",
  college:    "College",
  custom:     "Custom",
};

interface EditProgramForm {
  name: string;
  type: ProgramType;
}

interface EditProgramDialogProps {
  program: { id: string; name: string; type: ProgramType };
  open:    boolean;
  onClose: () => void;
}

export function EditProgramDialog({
  program,
  open,
  onClose,
}: EditProgramDialogProps): React.JSX.Element {
  const updateMutation = useUpdateProgram();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditProgramForm>({
    defaultValues: { name: program.name, type: program.type },
  });

  const selectedType = watch("type");

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: EditProgramForm) => {
    updateMutation.mutate(
      {
        id: program.id,
        data: {
          name: values.name,
          type: mapToApiProgramType(values.type), // ✅ FIX HERE
        },
      },
      {
        onSuccess: () => {
          toast.success("Program updated.");
          handleClose();
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<{ message: string }>;
          toast.error(
            axiosErr?.response?.data?.message ?? "Failed to update program."
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Program</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Program Name</Label>
            <Input
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as ProgramType)}
            >
              <SelectTrigger>
                <SelectValue>
                  {PROGRAM_TYPE_LABELS[selectedType] ?? "Select type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROGRAM_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}