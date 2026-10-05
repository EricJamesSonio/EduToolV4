"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, Clock, Plus, Trash2 } from "lucide-react";

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { orgScheduleConfigApi } from "@/api/admin/org-schedule-config.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { generateSlots, formatHourLabel } from "@/utils/schedule-slots.utils";
import type { OrgScheduleBreak } from "@/types/admin/org-schedule-config.types";
import type { AxiosError } from "axios";

type FormValues = {
  startTime: string;
  endTime: string;
  slotDuration: string;
  activeWeekdays: number[];
  breaks: OrgScheduleBreak[];
};

const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60] as const;

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/** Displayed Mon -> Sun, matching the grid's column order. */
const WEEKDAY_CHOICES = [
  { value: 1, short: "Mon", full: "Monday" },
  { value: 2, short: "Tue", full: "Tuesday" },
  { value: 3, short: "Wed", full: "Wednesday" },
  { value: 4, short: "Thu", full: "Thursday" },
  { value: 5, short: "Fri", full: "Friday" },
  { value: 6, short: "Sat", full: "Saturday" },
  { value: 0, short: "Sun", full: "Sunday" },
];

export function OrgScheduleTab(): React.JSX.Element {
  const { data: cfg, isLoading } = useAsyncQuery(
    adminQueryKeys.orgScheduleConfig.detail(),
    orgScheduleConfigApi.get,
    { meta: { preset: "static", feature: "organization" } },
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      startTime: "07:00",
      endTime: "17:00",
      slotDuration: "30",
      // Inert default: every day is a school day until an admin narrows it.
      activeWeekdays: [...ALL_WEEKDAYS],
      breaks: [],
    },
  });

  useEffect(() => {
    if (cfg) {
      reset({
        startTime: cfg.startTime,
        endTime: cfg.endTime,
        slotDuration: String(cfg.slotDuration),
        activeWeekdays:
          cfg.activeWeekdays?.length ? cfg.activeWeekdays : [...ALL_WEEKDAYS],
        breaks: cfg.breaks ?? [],
      });
    }
  }, [cfg, reset]);

  const mutate = useMutationWithInvalidation(
    (values: FormValues) =>
      orgScheduleConfigApi.upsert({
        startTime: values.startTime,
        endTime: values.endTime,
        slotDuration: Number(values.slotDuration),
        activeWeekdays: values.activeWeekdays,
        breaks: values.breaks,
      }),
    {
      invalidateKeys: [adminQueryKeys.orgScheduleConfig.detail()],
      onSuccess: (updated) => {
        toast.success("Schedule settings updated.");
        reset({
          startTime: updated.startTime,
          endTime: updated.endTime,
          slotDuration: String(updated.slotDuration),
          activeWeekdays:
            updated.activeWeekdays?.length
              ? updated.activeWeekdays
              : [...ALL_WEEKDAYS],
          breaks: updated.breaks ?? [],
        });
      },
      onError: (err: unknown) => {
        const ax = err as AxiosError<{ message?: string }>;
        const msg =
          (ax.response?.data as { message?: string })?.message ??
          ax.message ??
          "Failed to update schedule settings.";
        // 409 strict-blocking case
        if (ax.response?.status === 409) {
          toast.error(msg, { duration: 6000 });
        } else {
          toast.error(msg);
        }
      },
    },
  );

  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const slotDuration = watch("slotDuration");
  const activeWeekdays = watch("activeWeekdays") ?? [];
  const breaks = watch("breaks") ?? [];

  const toggleWeekday = (day: number): void => {
    const next = activeWeekdays.includes(day)
      ? activeWeekdays.filter((d) => d !== day)
      : [...activeWeekdays, day].sort((a, b) => a - b);
    setValue("activeWeekdays", next, { shouldDirty: true, shouldValidate: true });
  };

  const setBreaks = (next: OrgScheduleBreak[]): void =>
    setValue("breaks", next, { shouldDirty: true });

  const updateBreak = (
    index: number,
    patch: Partial<OrgScheduleBreak>,
  ): void =>
    setBreaks(breaks.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  const addBreak = (): void =>
    setBreaks([
      ...breaks,
      { label: "Break", start: "12:00", end: "13:00" },
    ]);

  const removeBreak = (index: number): void =>
    setBreaks(breaks.filter((_, i) => i !== index));

  const noSchoolDay = activeWeekdays.length === 0;

  const preview = useMemo(() => {
    const dur = Number(slotDuration);
    if (!startTime || !endTime || Number.isNaN(dur)) return [];
    // basic validation: start < end else empty
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (Number.isNaN(sh) || Number.isNaN(eh)) return [];
    const sM = sh * 60 + sm;
    const eM = eh * 60 + em;
    if (sM >= eM) return [];
    return generateSlots(startTime, endTime, dur);
  }, [startTime, endTime, slotDuration]);

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="px-6 py-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" /> Schedule time range
        </CardTitle>
        <CardDescription className="text-xs">
          Global for all departments. Classes can only be scheduled inside this window and must align to the slot length.
          Changing the range is blocked if existing classes would go out of bounds.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-5 space-y-5">
        <form
          onSubmit={handleSubmit((v) => mutate.mutate(v))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sched-start" className="text-xs text-muted-foreground">
                Start time
              </Label>
              <Input id="sched-start" type="time" step={60} {...register("startTime", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sched-end" className="text-xs text-muted-foreground">
                End time
              </Label>
              <Input id="sched-end" type="time" step={60} {...register("endTime", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Slot duration</Label>
              <Select
                value={slotDuration ?? "30"}
                onValueChange={(v) => setValue("slotDuration", v ?? "30", { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} mins
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
              Preview ({preview.length} slots {preview.length ? `— ${startTime} to ${endTime} every ${slotDuration}m` : ""})
            </p>
            {preview.length ? (
              <div className="flex flex-wrap gap-1.5">
                {preview.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
                    title={t}
                  >
                    {formatHourLabel(t)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Enter a valid start before end to see slots.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">School days</Label>
              <button
                type="button"
                onClick={() =>
                  setValue(
                    "activeWeekdays",
                    activeWeekdays.length === ALL_WEEKDAYS.length
                      ? []
                      : [...ALL_WEEKDAYS],
                    { shouldDirty: true },
                  )
                }
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                {activeWeekdays.length === ALL_WEEKDAYS.length
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_CHOICES.map((d) => {
                const on = activeWeekdays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={on}
                    title={d.full}
                    onClick={() => toggleWeekday(d.value)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
            {noSchoolDay ? (
              <p className="text-xs text-destructive">
                Select at least one school day — classes cannot be scheduled
                otherwise.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Only these days can be selected when scheduling a class.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Breaks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={addBreak}
                disabled={breaks.length >= 6}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add break
              </Button>
            </div>
            {breaks.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No breaks. Add lunch or recess so no class is scheduled across
                it.
              </p>
            ) : (
              <div className="space-y-2">
                {breaks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={b.label}
                      maxLength={40}
                      aria-label="Break label"
                      placeholder="Lunch"
                      onChange={(e) =>
                        updateBreak(i, { label: e.target.value })
                      }
                      className="h-8 flex-1"
                    />
                    <Input
                      type="time"
                      step={60}
                      aria-label="Break start"
                      value={b.start}
                      onChange={(e) =>
                        updateBreak(i, { start: e.target.value })
                      }
                      className="h-8 w-28"
                    />
                    <Input
                      type="time"
                      step={60}
                      aria-label="Break end"
                      value={b.end}
                      onChange={(e) =>
                        updateBreak(i, { end: e.target.value })
                      }
                      className="h-8 w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${b.label || "break"}`}
                      onClick={() => removeBreak(i)}
                      className="h-8 w-8 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Breaks apply to every school day and must line up with the{" "}
              {slotDuration}m slot grid.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutate.isPending || !isDirty || noSchoolDay}>
              {mutate.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save schedule
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
