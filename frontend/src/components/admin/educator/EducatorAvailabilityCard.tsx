"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, RotateCcw, Save, TriangleAlert } from "lucide-react";

import {
  useScheduleProfile,
  useSetScheduleProfile,
} from "@/hooks/admin/useEducators";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { AxiosError } from "axios";

/** Displayed Mon -> Sun, matching the schedule grid's column order. */
const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

interface EducatorAvailabilityCardProps {
  educatorId: string;
}

export function EducatorAvailabilityCard({
  educatorId,
}: EducatorAvailabilityCardProps): React.JSX.Element {
  const { data: profile, isLoading } = useScheduleProfile(educatorId);
  const { activeWeekdays } = useScheduleWindow();
  const mutation = useSetScheduleProfile();

  const [useCustom, setUseCustom] = useState(false);
  const [days, setDays] = useState<number[]>([]);

  // Seed the form once the profile arrives.
  useEffect(() => {
    if (!profile) return;
    setUseCustom(profile.useCustomAvailability);
    setDays(profile.availableWeekdays ?? []);
  }, [profile]);

  // A day the school is closed can never be used, so it renders disabled
  // rather than silently dropped — otherwise the admin cannot tell why a
  // chosen day had no effect.
  const orgActive =
    activeWeekdays && activeWeekdays.length > 0
      ? activeWeekdays
      : [0, 1, 2, 3, 4, 5, 6];
  const isDayClosed = (d: number) => !orgActive.includes(d);

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d)
        ? prev.filter((x) => x !== d)
        : [...prev, d].sort((a, b) => a - b),
    );
  };

  const resetToDefault = () => {
    setUseCustom(false);
    setDays([]);
  };

  const save = () => {
    mutation.mutate(
      {
        educatorId,
        useCustomAvailability: useCustom,
        availableWeekdays: useCustom ? days : [],
      },
      {
        onError: (err: unknown) => {
          const ax = err as AxiosError<{ message?: string }>;
          toast.error(
            ax.response?.data?.message ?? "Failed to update availability.",
          );
        },
      },
    );
  };
  // All-unavailable would leave the educator unschedulable; the server rejects
  // it, and the button is disabled so it is never attempted.
  const noDaysPicked = useCustom && days.length === 0;
  const sameDays = (a: number[], b: number[]) =>
    JSON.stringify([...a].sort((x, y) => x - y)) ===
    JSON.stringify([...b].sort((x, y) => x - y));
  const dirty =
    !!profile &&
    (useCustom !== profile.useCustomAvailability ||
      !sameDays(days, profile.availableWeekdays ?? []));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold not-interactive">
            <CalendarDays className="h-4 w-4" />
            Availability
          </h2>
          <p className="text-xs text-muted-foreground">
            Restricts which days this educator can be scheduled on.
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset to default
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={mutation.isPending || !dirty || noDaysPicked}
            >
              {mutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="use-custom-availability"
          checked={useCustom}
          onCheckedChange={(v) => setUseCustom(v)}
          disabled={isLoading}
        />
        <Label htmlFor="use-custom-availability" className="text-sm font-normal">
          Available on all school days{" "}
          <span className="text-muted-foreground">(default)</span>
        </Label>
      </div>

      {!useCustom ? (
        <p className="text-xs text-muted-foreground">
          This educator can be scheduled on any day the school holds classes,
          for the full daily window set in Organization → Schedule.
        </p>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Available days</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => {
              const closed = isDayClosed(d.value);
              const on = days.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  disabled={closed}
                  aria-pressed={on}
                  title={
                    closed
                      ? "The school does not hold classes on this day."
                      : undefined
                  }
                  onClick={() => toggleDay(d.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    closed
                      ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground/50"
                      : on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          {noDaysPicked ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <TriangleAlert className="h-3.5 w-3.5" />
              Pick at least one day, otherwise this educator cannot be scheduled.
            </p>
          ) : null}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Narrowing availability never moves an existing class. Classes already
        scheduled on a removed day are reported, not rescheduled.
      </p>
    </div>
  );
};
