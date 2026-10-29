"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { useSchoolProfileData } from "@/hooks/admin/useSchoolProfile";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

import type { SchoolYear } from "@/types/admin/school-year.types";
import type { CreateForm, ShortDurationWarning } from "./types/types";
import { isShortDurationError, getSchoolYearOverlapMessage } from "./utils/helpers";
import {
  startDatePickerDisabled,
  endDatePickerDisabled,
} from "@/lib/school-year-dates";

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * When provided, the caller handles what happens after creation (for example
   * the Data Seeder selecting the new year), so the "Seed it" shortcut is skipped.
   */
  onCreated?: (schoolYear: SchoolYear) => void;
}

function previewName(start: string, end: string): string | null {
  if (!start || !end) return null;
  const startYear = new Date(start).getFullYear();
  const endYear = new Date(end).getFullYear();
  if (isNaN(startYear) || isNaN(endYear)) return null;
  return `SY ${startYear}-${endYear}`;
}

export function CreateSchoolYearDialog({ open, onClose, onCreated }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [shortDurationWarning, setShortDurationWarning] =
    useState<ShortDurationWarning | null>(null);

  const { data: profileData } = useSchoolProfileData();
  const hasProfile = (profileData?.departments?.length ?? 0) > 0;

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateForm>({
    defaultValues: { start_date: "", end_date: "" },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const namePreview = previewName(startDate, endDate);

  const mutation = useMutation({
    mutationFn: (
      payload: CreateForm & { name: string; confirm_short_duration?: boolean },
    ) =>
      schoolYearApi.create({
        name: payload.name,
        start_date: payload.start_date || undefined,
        end_date: payload.end_date || undefined,
        confirm_short_duration: payload.confirm_short_duration,
      }),

    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.schoolYears.list() });

      const createdSchoolYear = (result?.data ?? result) as SchoolYear | undefined;

      reset();
      setShortDurationWarning(null);

      if (onCreated && createdSchoolYear?.id) {
        toast.success("School year created.");
        onCreated(createdSchoolYear);
        onClose();
        return;
      }

      // Seeding lives in School Profile -> Seed a School Year, where the
      // academic calendar is set up in the same flow.
      if (hasProfile && createdSchoolYear?.id) {
        const targetId = createdSchoolYear.id;
        toast.success("School year created.", {
          description:
            "Seed it from School Profile to set up its academic calendar and structure.",
          duration: 10000,
          action: {
            label: "Seed it",
            onClick: () =>
              router.push(`/admin/data-seeder?mode=seed&schoolYearId=${targetId}`),
          },
        });
      } else {
        toast.success("School year created.");
      }

      onClose();
    },

    onError: (err: unknown, variables) => {
      const overlapMessage = getSchoolYearOverlapMessage(err);
      if (overlapMessage) {
        setShortDurationWarning(null);
        toast.error(overlapMessage);
        return;
      }
      if (isShortDurationError(err)) {
        setShortDurationWarning({ pendingValues: variables });
        return;
      }
      toast.error("Failed to create school year.");
    },
  });

  const onSubmit = (values: CreateForm) => {
    // The name is derived from the dates (shown as a preview) — the submit
    // button stays disabled until both dates yield one.
    const name = previewName(values.start_date, values.end_date);
    if (!name) return;
    mutation.mutate({ ...values, name });
  };

  const handleClose = () => {
    reset();
    setShortDurationWarning(null);
    onClose();
  };

  const handleConfirmShortDuration = () => {
    if (!shortDurationWarning) return;
    const name = previewName(
      shortDurationWarning.pendingValues.start_date,
      shortDurationWarning.pendingValues.end_date,
    );
    if (!name) return;
    mutation.mutate({
      ...shortDurationWarning.pendingValues,
      name,
      confirm_short_duration: true,
    });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="New School Year"
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <DatePicker
                value={startDate || ""}
                onChange={(v) =>
                  setValue("start_date", v, { shouldValidate: true, shouldDirty: true })
                }
                disabled={startDatePickerDisabled}
              />
              <input type="hidden" value={startDate} onChange={() => {}} required />
              {errors.start_date && (
                <p className="text-xs text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <DatePicker
                value={endDate || ""}
                onChange={(v) =>
                  setValue("end_date", v, { shouldValidate: true, shouldDirty: true })
                }
                disabled={(date) => endDatePickerDisabled(date, startDate)}
              />
              <input type="hidden" value={endDate} onChange={() => {}} required />
              {errors.end_date && (
                <p className="text-xs text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">School year name</p>
            <p className="text-sm font-medium">
              {namePreview ?? "Select both dates to generate the name"}
            </p>
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
            <Button type="submit" disabled={mutation.isPending || !startDate || !endDate}>
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