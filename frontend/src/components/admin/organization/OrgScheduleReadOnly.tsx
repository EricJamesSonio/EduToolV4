"use client";

import { Clock } from "lucide-react";
import { useOrgScheduleConfig } from "@/hooks/admin/useOrgScheduleConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSlots, formatHourLabel } from "@/utils/schedule-slots.utils";

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

const WEEKDAY_CHOICES = [
  { value: 1, short: "Mon", full: "Monday" },
  { value: 2, short: "Tue", full: "Tuesday" },
  { value: 3, short: "Wed", full: "Wednesday" },
  { value: 4, short: "Thu", full: "Thursday" },
  { value: 5, short: "Fri", full: "Friday" },
  { value: 6, short: "Sat", full: "Saturday" },
  { value: 0, short: "Sun", full: "Sunday" },
];

export function OrgScheduleReadOnly(): React.JSX.Element {
  const { data: cfg, isLoading } = useOrgScheduleConfig();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-6 py-5 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">Schedule time range</p>
        <p className="text-xs text-muted-foreground leading-snug">
          Global daily window and slot length for all departments.
        </p>
      </div>
    </div>
  );

  if (!cfg) {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-6 py-5 space-y-4">
        {header}
        <p className="text-sm text-muted-foreground not-interactive">
          No schedule has been configured yet.
        </p>
      </div>
    );
  }

  const activeWeekdays =
    cfg.activeWeekdays && cfg.activeWeekdays.length > 0
      ? cfg.activeWeekdays
      : ALL_WEEKDAYS;
  const breaks = cfg.breaks ?? [];
  const slots = generateSlots(cfg.startTime, cfg.endTime, cfg.slotDuration);

  const stats = [
    { label: "Start time", value: formatHourLabel(cfg.startTime) },
    { label: "End time", value: formatHourLabel(cfg.endTime) },
    { label: "Slot duration", value: `${cfg.slotDuration} mins` },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card px-6 py-5 space-y-5">
      {header}

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <dt className="text-xs text-muted-foreground not-interactive">{stat.label}</dt>
            <dd className="text-sm font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground not-interactive">School days</p>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_CHOICES.map((day) => {
            const on = activeWeekdays.includes(day.value);
            return (
              <span
                key={day.value}
                title={day.full}
                className={
                  on
                    ? "rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
                }
              >
                {day.short}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground not-interactive">Breaks</p>
        {breaks.length === 0 ? (
          <p className="text-sm text-muted-foreground not-interactive">No breaks configured.</p>
        ) : (
          <ul className="space-y-1.5">
            {breaks.map((b, index) => (
              <li
                key={`${b.label}-${index}`}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="font-medium">{b.label || "Break"}</span>
                <span className="text-muted-foreground">
                  {formatHourLabel(b.start)} - {formatHourLabel(b.end)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground not-interactive">
          Time slots ({slots.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {slots.map((slot) => (
            <span
              key={slot}
              className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
            >
              {formatHourLabel(slot)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}