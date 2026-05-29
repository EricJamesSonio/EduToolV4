// frontend/src/app/admin/school-years/CreateSchoolYearDialog.tsx

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CreateForm, ShortDurationWarning } from "./types/types";
import { isShortDurationError } from "./utils/helpers";

// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateSchoolYearDialog({ open, onClose }: Props): React.JSX.Element {
  const queryClient = useQueryClient();

  const [shortDurationWarning, setShortDurationWarning] =
    useState<ShortDurationWarning | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    defaultValues: { name: "", start_date: "", end_date: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateForm & { confirm_short_duration?: boolean }) =>
      schoolYearApi.create({
        name: payload.name,
        start_date: payload.start_date || undefined,
        end_date: payload.end_date || undefined,
        confirm_short_duration: payload.confirm_short_duration,
      }),

    onSuccess: () => {
      toast.success("School year created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      reset();
      setShortDurationWarning(null);
      onClose();
    },

    onError: (err: unknown, variables) => {
      if (isShortDurationError(err)) {
        setShortDurationWarning({ pendingValues: variables });
        return;
      }
      toast.error("Failed to create school year.");
    },
  });

  const onSubmit = (values: CreateForm) => mutation.mutate(values);

  const handleClose = () => {
    reset();
    setShortDurationWarning(null);
    onClose();
  };

  const handleConfirmShortDuration = () => {
    if (!shortDurationWarning) return;
    mutation.mutate({
      ...shortDurationWarning.pendingValues,
      confirm_short_duration: true,
    });
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} title="New School Year" size="sm">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sy-name">Title</Label>
              <Input
                id="sy-name"
                placeholder="e.g. School Year 2026-2027"
                {...register("name", {
                  required: "Title is required",
                  minLength: { value: 2, message: "At least 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  {...register("start_date", {
                    required: "Start date is required",
                  })}
                />
                {errors.start_date && (
                  <p className="text-xs text-destructive">{errors.start_date.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  {...register("end_date", {
                    required: "End date is required",
                  })}
                />
                {errors.end_date && (
                  <p className="text-xs text-destructive">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
      </Modal>

      <ConfirmDialog
        open={!!shortDurationWarning}
        title="School year duration warning"
        message="The set school year date span range was below 10 months. Are you sure you want to proceed?"
        confirmLabel="Yes, create it"
        destructive={false}
        isLoading={mutation.isPending}
        onConfirm={handleConfirmShortDuration}
        onOpenChange={(o) => {
          if (!o) setShortDurationWarning(null);
        }}
      />
    </>
  );
}