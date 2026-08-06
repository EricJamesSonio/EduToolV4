"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { SchoolYear } from "@/types/admin/school-year.types";
import type { ShortDurationWarning } from "./types/types";
import { isShortDurationError } from "./utils/helpers";

interface Props {
  schoolYear: SchoolYear;
  open: boolean;
  onClose: () => void;
}

export function EditSchoolYearDialog({ schoolYear, open, onClose }: Props): React.JSX.Element {
  const queryClient = useQueryClient();

  const [shortDurationWarning, setShortDurationWarning] =
    useState<ShortDurationWarning | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; start_date: string; end_date: string }>({
    defaultValues: {
      name: schoolYear.name,
      start_date: schoolYear.start_date ?? "",
      end_date: schoolYear.end_date ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: { name: string; start_date: string; end_date: string; confirm_short_duration?: boolean }) =>
      schoolYearApi.update(schoolYear.id, {
        name: payload.name,
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
        confirm_short_duration: payload.confirm_short_duration,
      }),

    onSuccess: () => {
      toast.success("School year updated.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.schoolYears.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      onClose();
    },

    onError: (err: unknown, variables) => {
      if (isShortDurationError(err)) {
        setShortDurationWarning({ pendingValues: variables });
        return;
      }
      toast.error("Failed to update school year.");
    },
  });

  const onSubmit = (values: { name: string; start_date: string; end_date: string }) =>
    mutation.mutate(values);

  const handleConfirmShortDuration = () => {
    if (!shortDurationWarning) return;
    mutation.mutate({
      ...shortDurationWarning.pendingValues,
      confirm_short_duration: true,
    });
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Edit School Year" size="sm">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sy-name">Title</Label>
              <Input
                id="sy-name"
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
                  {...register("start_date")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  {...register("end_date")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
      </Modal>

      <ConfirmDialog
        open={!!shortDurationWarning}
        title="School year duration warning"
        message="The set school year date span range was below 10 months. Are you sure you want to proceed?"
        confirmLabel="Yes, save it"
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
