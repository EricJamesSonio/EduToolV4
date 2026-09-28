"use client";

import { useCallback, useEffect, useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useOrgScheduleConfig } from "@/hooks/admin/useOrgScheduleConfig";
import { useClassScheduleContext } from "@/hooks/admin/useClassScheduleContext";
import { toMinutes } from "@/utils/schedule-slots.utils";

import { classApi } from "@/api/admin/class.api";
import type { UpdateClassRequest, ScheduleSlot } from "@/api/admin/class.api";
import { educatorApi } from "@/api/admin/educator.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Class } from "@/types/admin/class.types";

import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ScheduleSlotFields } from "../ScheduleSlotFields";
import type { ScheduleConflictState } from "../ClassSchedulePicker";
import { toArray } from "../utils/classDetail.utils";

interface EditClassForm {
  educatorId: string;
  sectionId: string;
  schedules: { weekday: string; startTime: string; endTime: string }[];
}

interface EditClassDialogProps {
  cls: Class;
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
}

const NO_CONFLICTS: ScheduleConflictState = { educator: false, section: false };

export function EditClassDialog({ cls, open, onClose, schoolYearId }: EditClassDialogProps): React.JSX.Element {
  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.educators.list(),
    () => educatorApi.getAll(),
  );
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId }),
    () => sectionApi.getAll(schoolYearId),
    { enabled: !!schoolYearId },
  );
  const sections = toArray<{ id: string; name: string }>(sectionsRaw);

  // Safety-net bounds check on submit — ClassSchedulePicker already restricts
  // clickable cells to this window, but this guards against stale state.
  const { data: scheduleCfg } = useOrgScheduleConfig();
  const winStart = scheduleCfg?.startTime ?? "07:00";
  const winEnd = scheduleCfg?.endTime ?? "17:00";

  const methods = useForm<EditClassForm>({
    defaultValues: {
      educatorId: cls.educatorId ?? "",
      sectionId: cls.sectionId ?? "",
      schedules:
        cls.schedules?.map((s) => ({
          weekday: String(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) ?? [],
    },
  });

  const { handleSubmit, reset, setValue, watch } = methods;

  const selectedEducatorId = watch("educatorId");
  const selectedSectionId = watch("sectionId");

  // Same shared fetch CreateClassDialog uses — the educator's other classes
  // AND this section's (e.g. "BSCS 1-A") other classes, this school year.
  // This class's own current slots are excluded from both so they don't
  // register as conflicts with themselves.
  const { educatorClasses, sectionClasses, isLoading: scheduleContextLoading } = useClassScheduleContext({
    schoolYearId,
    educatorId: selectedEducatorId,
    sectionId: selectedSectionId,
    excludeClassId: cls.id,
    enabled: open,
  });

  // ── Schedule conflict gating ────────────────────────────────────────────────
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflictState>(NO_CONFLICTS);
  const handleScheduleConflictsChange = useCallback((conflicts: ScheduleConflictState) => {
    setScheduleConflicts(conflicts);
  }, []);
  useEffect(() => {
    if (open) setScheduleConflicts(NO_CONFLICTS);
  }, [open]);

  const mutation = useMutationWithInvalidation(
    (values: EditClassForm) => {
      const payload: UpdateClassRequest = {
        educatorId: values.educatorId || undefined,
        sectionId: values.sectionId || undefined,
        schedules: values.schedules.map((s) => ({
          weekday: Number(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) as ScheduleSlot[],
      };
      return classApi.update(cls.id, payload);
    },
    {
      invalidateKeys: [
        queryKeys.admin.classes.detail(cls.id),
        queryKeys.admin.classes.list(),
      ],
      onSuccess: () => {
        toast.success("Class updated.");
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to update class.");
      },
    },
  );

  const handleValid = (v: EditClassForm): void => {
    if (v.schedules.length === 0) {
      toast.error("Add at least one schedule slot.");
      return;
    }
    const bad = v.schedules.find(
      (s) =>
        toMinutes(s.startTime) >= toMinutes(s.endTime) ||
        toMinutes(s.startTime) < toMinutes(winStart) ||
        toMinutes(s.endTime) > toMinutes(winEnd),
    );
    if (bad) {
      toast.error(`Schedules must be within ${winStart}–${winEnd}.`);
      return;
    }
    mutation.mutate(v);
  };

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const isSubmitDisabled =
    mutation.isPending ||
    scheduleConflicts.educator ||
    scheduleConflicts.section;

  return (
    <Modal open={open} onClose={handleClose} title="Edit Class" size="lg">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(handleValid)}
          className="space-y-4 mt-1"
        >
          {/* Subject (read-only) */}
          {cls.subjectName && (
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <div className="flex h-9 w-full items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                {cls.subjectName}
              </div>
              <p className="text-xs text-muted-foreground">
                Subject cannot be changed after the class is created.
              </p>
            </div>
          )}

          {/* Educator */}
          <div className="space-y-1.5">
            <Label>Educator</Label>
            <Select
              value={selectedEducatorId}
              onValueChange={(v) => setValue("educatorId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an educator">
                {educators.find((e) => e.id === selectedEducatorId)?.fullName ?? "Select an educator"}
              </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {educators.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section (filtered by the class levelId) */}
          <div className="space-y-1.5">
            <Label>
              Section{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={selectedSectionId}
              onValueChange={(v) => setValue("sectionId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="No section">
                {sections.find((s) => s.id === selectedSectionId)?.name ?? "No section"}
              </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No section</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changing the section updates the class capacity to match it.
            </p>
          </div>

          {/* Schedule — same educator + section aware grid as Create, with
              "+ Add slot" to grow past the class's current slot count. */}
          <ScheduleSlotFields
            educatorClasses={educatorClasses}
            sectionClasses={sectionClasses}
            isLoading={scheduleContextLoading}
            onConflictsChange={handleScheduleConflictsChange}
          />

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
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}