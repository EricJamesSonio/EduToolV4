"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { programApi } from "@/api/admin/program.api";
import type { ProgramType } from "@/api/admin/program.api";
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
import { PROGRAM_TYPE_OPTIONS } from "./constants";
import { AxiosError } from "axios";

interface CreateForm {
  name: string;
  type: ProgramType;
}

interface CreateProgramDialogProps {
  open: boolean;
  onClose: () => void;
  schoolYearId: string | null; // <-- allow null temporarily
}

export function CreateProgramDialog({
  open,
  onClose,
  schoolYearId,
}: CreateProgramDialogProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateForm>({ defaultValues: { name: "", type: "elementary" } });

  const selectedType = watch("type");

  // Safely handle mutation
  const mutation = useMutation({
    mutationFn: (values: CreateForm) => {
      if (!schoolYearId) {
        // Prevent sending invalid data
        throw new Error("Cannot create program: school year not selected.");
      }
      return programApi.create({ ...values, schoolYearId });
    },
    onSuccess: () => {
      toast.success("Program created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "programs", schoolYearId] });
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }> | Error) => {
      const message =
        err instanceof AxiosError
          ? err?.response?.data?.message
          : err.message;
      toast.error(message ?? "Failed to create program.");
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Program" size="sm">
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="prog-name">Program Name</Label>
            <Input
              id="prog-name"
              placeholder="e.g. Bachelor of Science in IT"
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

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as ProgramType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAM_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button
              type="submit"
              disabled={mutation.isPending || !schoolYearId} // <-- disable if schoolYearId missing
            >
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}