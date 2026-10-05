"use client";

import { useMemo } from "react";

import { useOrgScheduleConfig } from "@/hooks/admin/useOrgScheduleConfig";
import { timeToMinutes } from "@/utils/classes.utils";

/**
 * Props that make WeeklyScheduleGrid render the school's full operating
 * window (Mon-Sun, every slot) instead of only the span the supplied classes
 * happen to cover.
 *
 * Source of truth is the org schedule config (startTime/endTime/slotDuration),
 * the same values ClassSchedulePicker uses for slot picking - so the read-only
 * timetable and the editing picker always agree on the day.
 *
 * When the config is unavailable (not configured, or the request failed) the
 * window props come back undefined and the grid falls back to fitting the
 * classes it was given, which is its historical behaviour.
 */
export interface ScheduleBreakWindow {
  startMin: number;
  endMin: number;
  label: string;
}

export function useScheduleWindow(): {
  windowStartMin?: number;
  windowEndMin?: number;
  stepMin: number;
  showAllDays: boolean;
  isConfigured: boolean;
  /** True while the org config is still loading. */
  isLoading: boolean;
  /** True when the org config request failed — the grid is on fallback. */
  isError: boolean;
  /** Weekdays the school holds classes. Empty/undefined = rule not configured. */
  activeWeekdays?: number[];
  /** Break ranges in minutes-of-day, for rendering and click-blocking. */
  blockedRanges?: ScheduleBreakWindow[];
  isDayActive: (weekday: number) => boolean;
  isBreakMinute: (minute: number) => boolean;
} {
  const { data: scheduleCfg, isLoading, isError } = useOrgScheduleConfig();

  return useMemo(() => {
    const startMin = scheduleCfg?.startTime
      ? timeToMinutes(scheduleCfg.startTime)
      : undefined;
    const endMin = scheduleCfg?.endTime
      ? timeToMinutes(scheduleCfg.endTime)
      : undefined;

    const valid =
      startMin != null &&
      endMin != null &&
      Number.isFinite(startMin) &&
      Number.isFinite(endMin) &&
      endMin > startMin;

    // Weekdays and breaks are usable even when the time window is not yet
    // valid, so an unconfigured org still greys out non-school days.
    const activeWeekdays =
      scheduleCfg?.activeWeekdays && scheduleCfg.activeWeekdays.length > 0
        ? scheduleCfg.activeWeekdays
        : undefined;

    const blockedRanges: ScheduleBreakWindow[] = (scheduleCfg?.breaks ?? [])
      .map((b) => ({
        startMin: timeToMinutes(b.start),
        endMin: timeToMinutes(b.end),
        label: b.label,
      }))
      .filter((b) => Number.isFinite(b.startMin) && b.endMin > b.startMin);

    const isDayActive = (weekday: number): boolean =>
      !activeWeekdays || activeWeekdays.includes(weekday);

    const isBreakMinute = (minute: number): boolean =>
      blockedRanges.some((b) => minute >= b.startMin && minute < b.endMin);

    if (!valid) {
      return {
        windowStartMin: undefined,
        windowEndMin: undefined,
        stepMin: scheduleCfg?.slotDuration ?? 30,
        showAllDays: true,
        isConfigured: false,
        isLoading,
        isError,
        activeWeekdays,
        blockedRanges,
        isDayActive,
        isBreakMinute,
      };
    }

    return {
      windowStartMin: startMin,
      windowEndMin: endMin,
      stepMin: scheduleCfg?.slotDuration ?? 30,
      // Always show the full week so a day with no classes still appears.
      showAllDays: true,
      isConfigured: true,
      isLoading,
      isError,
      activeWeekdays,
      blockedRanges,
      isDayActive,
      isBreakMinute,
    };
  }, [scheduleCfg, isLoading, isError]);
}