"use client";

import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useOrgScheduleConfig } from "@/hooks/admin/useOrgScheduleConfig";
import { generateSlots, formatHourLabel, toMinutes } from "@/utils/schedule-slots.utils";

import { classApi } from "@/api/admin/class.api";
import type { UpdateClassRequest, ScheduleSlot } from "@/api/admin/class.api";
import { educatorApi } from "@/api/admin/educator.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Class } from "@/types/admin/class.types";

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

import { WEEKDAY_LABELS, toArray } from "../utils/classDetail.utils";

interface EditClassForm {
  educatorId: string;
  sectionId: string;
  capacity: string;
  schedules: { weekday: string; startTime: string; endTime: string }[];
}

interface EditClassDialogProps {
  cls: Class;
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
}

const withCurrent = (opts: string[], v?: string): string[] =>
  v && !opts.includes(v) ? [v, ...opts] : opts;

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

  const { data: scheduleCfg } = useOrgScheduleConfig();
  const winStart = scheduleCfg?.startTime ?? "07:00";
  const winEnd = scheduleCfg?.endTime ?? "17:00";
  const slotMin = scheduleCfg?.slotDuration ?? 30;

  const startOptions = useMemo(
    () => generateSlots(winStart, winEnd, slotMin),
    [winStart, winEnd, slotMin],
  );
  const endOptions = useMemo(
    () => [...startOptions.slice(1), winEnd],
    [startOptions, winEnd],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EditClassForm>({
    defaultValues: {
      educatorId: cls.educatorId ?? "",
      sectionId: cls.sectionId ?? "",
      capacity: String(cls.capacity),
      schedules:
        cls.schedules?.map((s) => ({
          weekday: String(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) ?? [{ weekday: "1", startTime: "08:00", endTime: "09:00" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });

  const selectedEducatorId = watch("educatorId");
  const selectedSectionId = watch("sectionId");

  const mutation = useMutationWithInvalidation(
    (values: EditClassForm) => {
      const payload: UpdateClassRequest = {
        educatorId: values.educatorId || undefined,
        sectionId: values.sectionId || undefined,
        capacity: Number(values.capacity),
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

  return (
    <Modal open={open} onClose={handleClose} title="Edit Class" size="lg">

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
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              {...register("capacity", {
                required: "Capacity is required",
                min: { value: 1, message: "At least 1" },
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          {/* Schedules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              <button
                type="button"
                onClick={() =>
                  append({
                    weekday: "1",
                    startTime: startOptions[0] ?? "07:00",
                    endTime: startOptions[1] ?? "08:00",
                  })
                }
                className="text-xs text-primary hover:underline"
              >
                + Add slot
              </button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
              >
                <Select
                  value={watch(`schedules.${index}.weekday`)}
                  onValueChange={(v) =>
                    setValue(`schedules.${index}.weekday`, v ?? "")
                  }
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={watch(`schedules.${index}.startTime`)}
                  onValueChange={(v) =>
                    setValue(`schedules.${index}.startTime`, v ?? "", { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {withCurrent(startOptions, watch(`schedules.${index}.startTime`)).map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatHourLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-xs text-muted-foreground">–</span>

                <Select
                  value={watch(`schedules.${index}.endTime`)}
                  onValueChange={(v) =>
                    setValue(`schedules.${index}.endTime`, v ?? "", { shouldDirty: true })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {withCurrent(endOptions, watch(`schedules.${index}.endTime`)).map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatHourLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}