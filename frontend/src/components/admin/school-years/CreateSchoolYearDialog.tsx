"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { organizationApi } from "@/api/admin/organization.api";
import { useSchoolProfileData } from "@/hooks/admin/useSchoolProfile";
import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  SeedProgressDialog,
  type SeedOutcome,
} from "@/components/admin/data-seeder/SeedProgressDialog";
import { buildSeedStages } from "@/components/admin/data-seeder/seed-stages";

import type { CreateForm, ShortDurationWarning } from "./types/types";
import { isShortDurationError, getSchoolYearOverlapMessage } from "./utils/helpers";
import {
  startDatePickerDisabled,
  endDatePickerDisabled,
} from "@/lib/school-year-dates";

interface Props {
  open: boolean;
  onClose: () => void;
}

function previewName(start: string, end: string): string | null {
  if (!start || !end) return null;
  const startYear = new Date(start).getFullYear();
  const endYear = new Date(end).getFullYear();
  if (isNaN(startYear) || isNaN(endYear)) return null;
  return `SY ${startYear}-${endYear}`;
}

interface PendingSeedPrompt {
  schoolYearId: string;
  schoolYearName: string;
}

export function CreateSchoolYearDialog({ open, onClose }: Props): React.JSX.Element {
  const queryClient = useQueryClient();

  const [shortDurationWarning, setShortDurationWarning] =
    useState<ShortDurationWarning | null>(null);

  const { data: profileData } = useSchoolProfileData();
  const savedDepartments = profileData?.departments ?? [];
  const hasProfile = savedDepartments.length > 0;

  const [pendingSeedPrompt, setPendingSeedPrompt] =
    useState<PendingSeedPrompt | null>(null);
  const [seedOutcome, setSeedOutcome] = useState<SeedOutcome | null>(null);

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
      toast.success("School year created.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.schoolYears.list() });

      const createdSchoolYear = result?.data ?? result;
      const alreadySeeded = !!result?.seeded;

      reset();
      setShortDurationWarning(null);

      if (!alreadySeeded && hasProfile && createdSchoolYear?.id) {
        setPendingSeedPrompt({
          schoolYearId: createdSchoolYear.id,
          schoolYearName: createdSchoolYear.name ?? namePreview ?? "this school year",
        });
        return; // parent's onClose runs when the seed flow finishes/declines
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

  const seedMutation = useMutationWithInvalidation(
    (schoolYearId: string) =>
      organizationApi.seedOrg({
        schoolYearId,
        programs: savedDepartments.map((d) => d.type),
        seedGradingScales: true,
        seedGradingSchemes: true,
        // Semester templates/program calendars need per-year dates the admin
        // still has to enter — skipped here just like the org auto-seed path.
        seedSemesterTemplates: false,
        seedProgramCalendars: false,
      }),
    {
      invalidateKeys: [
        queryKeys.admin.schoolYears.all,
        queryKeys.admin.schoolYears.readiness(),
        queryKeys.admin.programs.all,
        queryKeys.admin.courses.all,
        queryKeys.admin.strands.all,
        queryKeys.admin.levels.all,
        queryKeys.admin.enrichedLevels.all,
        queryKeys.admin.sections.all,
        queryKeys.admin.subjects.all,
      ],
      onSuccess: (result) => {
        setSeedOutcome((prev) =>
          prev
            ? {
                status: "success",
                stages: prev.stages,
                result: (result?.result ?? {}) as Record<string, unknown>,
              }
            : prev,
        );
        toast.success("School year seeded from your School Profile.");
      },
      onError: (err: unknown) => {
        const message =
          isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : "Seeding failed. You can retry from School Profile → Seed a School Year.";
        setSeedOutcome((prev) =>
          prev ? { status: "error", stages: prev.stages, message } : prev,
        );
      },
    },
  );

  function handleConfirmSeed() {
    if (!pendingSeedPrompt) return;
    const { schoolYearId } = pendingSeedPrompt;
    setSeedOutcome({
      status: "running",
      stages: buildSeedStages({
        hasCollege: savedDepartments.some((d) => d.type === "college"),
        hasShs: savedDepartments.some((d) => d.type === "shs"),
      }),
    });
    setPendingSeedPrompt(null);
    seedMutation.mutate(schoolYearId);
  }

  function handleDeclineSeed() {
    setPendingSeedPrompt(null);
    onClose();
  }

  function handleSeedFinished() {
    setSeedOutcome(null);
    onClose();
  }

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
      {/* Hidden (not closed) while the seed prompt / progress is showing, so the
          parent doesn't unmount this component mid-seed. */}
      <Modal
        open={open && !pendingSeedPrompt && !seedOutcome}
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

      <ConfirmDialog
        open={!!pendingSeedPrompt}
        title="Seed this school year?"
        message={
          pendingSeedPrompt
            ? `Seed "${pendingSeedPrompt.schoolYearName}" with your School Profile configuration (departments, courses/strands, levels, sections, subjects, grading scales/schemes)? You can also do this later from Data Seeder.`
            : ""
        }
        confirmLabel="Yes, seed it"
        destructive={false}
        onConfirm={handleConfirmSeed}
        onOpenChange={(o) => {
          if (!o) handleDeclineSeed();
        }}
      />

      <SeedProgressDialog outcome={seedOutcome} onClose={handleSeedFinished} />
    </>
  );
}