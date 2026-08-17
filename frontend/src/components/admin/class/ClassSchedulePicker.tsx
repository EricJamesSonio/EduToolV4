"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import {
  EducatorScheduleGrid,
  type DraftCell,
  type ScheduleRange,
} from "@/components/admin/educator/EducatorScheduleGrid";
import type { Class } from "@/types/admin/class.types";
import {
  WEEKDAY_LABELS,
  minutesToTime,
  slotsOverlap,
  timeToMinutes,
  type SlotInput,
} from "@/utils/classes.utils";
import type { CreateClassForm } from "./CreateClassDialog.types";

interface ClassSchedulePickerProps {
  /** Fetched classes of the chosen educator; undefined until one is selected. */
  educatorClasses: Class[] | undefined;
  isLoading?: boolean;
  /** Fired with true whenever a slot overlaps the educator's schedule. */
  onConflictsChange?: (hasConflict: boolean) => void;
}

const MAX_SLOTS = 2;
const DEFAULT_WINDOW_START_MIN = 7 * 60;  // 07:00
const DEFAULT_WINDOW_END_MIN = 22 * 60;   // 22:00

export function ClassSchedulePicker({
  educatorClasses,
  isLoading,
  onConflictsChange,
}: ClassSchedulePickerProps) {
  const { getValues, setValue } = useFormContext<CreateClassForm>();

  const initialSchedules = getValues("schedules") ?? [];
  const initialCount = Math.min(MAX_SLOTS, Math.max(1, initialSchedules.length || 1));

  // Number of slots the user wants, and the committed ranges (null = not set).
  const [slotCount, setSlotCount] = useState<number>(initialCount);
  const [ranges, setRanges] = useState<(ScheduleRange | null)[]>(() => {
    const next: (ScheduleRange | null)[] = new Array(initialCount).fill(null);
    initialSchedules.slice(0, initialCount).forEach((s, i) => {
      if (s?.weekday && s?.startTime && s?.endTime) {
        next[i] = {
          weekday: Number(s.weekday),
          startMin: timeToMinutes(s.startTime),
          endMin: timeToMinutes(s.endTime),
        };
      }
    });
    return next;
  });
  const [draft, setDraft] = useState<DraftCell | null>(null);

  const filled = useMemo(
    () => ranges.filter((r): r is ScheduleRange => r !== null),
    [ranges],
  );
  const allFilled = filled.length >= slotCount;
  const hasEducator = educatorClasses !== undefined;

  // Keep the form's schedules array in sync with the picked ranges.
  useEffect(() => {
    const now = getValues("schedules") ?? [];
    const next = filled.map((r) => ({
      weekday: String(r.weekday),
      startTime: minutesToTime(r.startMin),
      endTime: minutesToTime(r.endMin),
    }));
    if (next.length !== now.length || next.some((s, i) =>
      now[i]?.weekday !== s.weekday || now[i]?.startTime !== s.startTime || now[i]?.endTime !== s.endTime,
    )) {
      setValue("schedules", next, { shouldDirty: true });
    }
  }, [filled, setValue, getValues]);

  const takenSlots = useMemo<SlotInput[]>(() => {
    const list: SlotInput[] = [];
    for (const cls of educatorClasses ?? []) {
      for (const s of cls.schedules ?? []) {
        list.push({ weekday: s.weekday, startTime: s.startTime, endTime: s.endTime });
      }
    }
    return list;
  }, [educatorClasses]);

  // Safety net: only draft-restored values can conflict, since grid picks are
  // restricted to vacant slots. Keep the gate for parity with the backend rule.
  const hasConflicts = useMemo(
    () =>
      filled.some((r) =>
        takenSlots.some((t) =>
          slotsOverlap(
            { weekday: r.weekday, startTime: minutesToTime(r.startMin), endTime: minutesToTime(r.endMin) },
            t,
          ),
        ),
      ),
    [filled, takenSlots],
  );

  useEffect(() => {
    onConflictsChange?.(hasConflicts);
  }, [hasConflicts, onConflictsChange]);

  const handlePickRange = (range: ScheduleRange): void => {
    setRanges((prev) => {
      const idx = prev.findIndex((r) => r === null);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = range;
      return next;
    });
    setDraft(null);
  };

  const handleClearSlot = (index: number): void => {
    setRanges((prev) => prev.map((r, i) => (i === index ? null : r)));
    setDraft(null);
  };

  const handleSlotCountChange = (count: number): void => {
    setSlotCount(count);
    setRanges((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push(null);
      return next;
    });
    setDraft(null);
  };

  const hint = !hasEducator
    ? "Select an educator first."
    : allFilled
      ? "All slots set — create the class."
      : draft
        ? `Click a free end time for slot ${filled.length + 1}.`
        : filled.length === 0
          ? "Click a free day & time for the start, then click the end time."
          : `Slot ${filled.length + 1}: click a free day & time for the start, then the end.`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground not-interactive">Slots:</span>
          {[1, 2].map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={slotCount === count}
              onClick={() => handleSlotCountChange(count)}
              className={slotCount === count
                ? "h-7 min-w-7 px-2 text-xs font-medium rounded-md bg-primary text-primary-foreground"
                : "h-7 min-w-7 px-2 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted"}
            >
              {count}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground not-interactive">{hint}</span>
      </div>

      {filled.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filled.map((range, index) => (
            <div
              key={`${range.weekday}-${range.startMin}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
            >
              <span className="not-interactive">
                {WEEKDAY_LABELS[range.weekday]} {minutesToTime(range.startMin)}–
                {minutesToTime(range.endMin)}
              </span>
              <button
                type="button"
                aria-label="Clear slot"
                onClick={() => handleClearSlot(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!hasEducator && !isLoading ? (
        <div className="flex items-center justify-center border rounded-md py-8 text-sm text-muted-foreground">
          Select an educator to view their schedule and pick a free time.
        </div>
      ) : (
        <EducatorScheduleGrid
          classes={educatorClasses ?? []}
          isLoading={isLoading}
          interactive
          showAllDays
          pickedRanges={filled}
          maxPicks={slotCount}
          draftStart={draft}
          defaultWindowStartMin={DEFAULT_WINDOW_START_MIN}
          defaultWindowEndMin={DEFAULT_WINDOW_END_MIN}
          onDraftStart={setDraft}
          onPickRange={handlePickRange}
        />
      )}

      {hasConflicts && (
        <p className="text-xs text-destructive">
          One or more slots overlap the educator&apos;s existing classes. Pick a different day/time
          for those slots.
        </p>
      )}
    </div>
  );
}