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
export function useScheduleWindow(): {
  windowStartMin?: number;
  windowEndMin?: number;
  stepMin: number;
  showAllDays: boolean;
  isConfigured: boolean;
} {
  const { data: scheduleCfg } = useOrgScheduleConfig();

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

    if (!valid) {
      return {
        windowStartMin: undefined,
        windowEndMin: undefined,
        stepMin: scheduleCfg?.slotDuration ?? 30,
        showAllDays: true,
        isConfigured: false,
      };
    }

    return {
      windowStartMin: startMin,
      windowEndMin: endMin,
      stepMin: scheduleCfg?.slotDuration ?? 30,
      // Always show the full week so a day with no classes still appears.
      showAllDays: true,
      isConfigured: true,
    };
  }, [scheduleCfg]);
}