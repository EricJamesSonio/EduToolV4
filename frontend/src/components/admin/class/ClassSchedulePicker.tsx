"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";
import {
  WeeklyScheduleGrid,
  SOURCE_LABELS,
  SOURCE_STYLES,
  type DraftCell,
  type ScheduleRange,
  type ScheduleSource,
} from "@/components/shared/WeeklyScheduleGrid";
import type { Class } from "@/types/admin/class.types";
import {
  WEEKDAY_LABELS,
  minutesToDisplayLabel,
  minutesToTime,
  slotsOverlap,
  timeToMinutes,
  type SlotInput,
} from "@/utils/classes.utils";
import type { CreateClassForm } from "./CreateClassDialog.types";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { orgScheduleConfigApi } from "@/api/admin/org-schedule-config.api";

export interface ScheduleConflictState {
  /** A picked slot overlaps one of the educator's other classes. */
  educator: boolean;
  /** A picked slot overlaps another class already scheduled for this section. */
  section: boolean;
}

interface ClassSchedulePickerProps {
  /** The selected educator's other classes this school year (drives one of the two conflict checks + grid blocks). */
  educatorClasses: Class[] | undefined;
  /** The selected section's other classes this school year (drives the other conflict check + grid blocks). Section is optional on a class, so this may be undefined/empty. */
  sectionClasses?: Class[] | undefined;
  isLoading?: boolean;
  /** Caps the number of slots. Omit for unlimited — grow with "+ Add slot". */
  maxSlots?: number;
  /** Fired whenever the picked slots' conflict status changes, split by source. */
  onConflictsChange?: (conflicts: ScheduleConflictState) => void;
}

function toTaken(classes: Class[] | undefined): SlotInput[] {
  const list: SlotInput[] = [];
  for (const cls of classes ?? []) {
    for (const s of cls.schedules ?? []) {
      list.push({ weekday: s.weekday, startTime: s.startTime, endTime: s.endTime });
    }
  }
  return list;
}

export function ClassSchedulePicker({
  educatorClasses,
  sectionClasses,
  isLoading,
  maxSlots,
  onConflictsChange,
}: ClassSchedulePickerProps) {
  const { getValues, setValue } = useFormContext<CreateClassForm>();

  const { data: scheduleCfg, isLoading: cfgLoading } = useAsyncQuery(
    adminQueryKeys.orgScheduleConfig.detail(),
    orgScheduleConfigApi.get,
    { meta: { preset: "static", feature: "organization" } },
  );

  const windowStartMin = scheduleCfg ? timeToMinutes(scheduleCfg.startTime) : undefined;
  const windowEndMin = scheduleCfg ? timeToMinutes(scheduleCfg.endTime) : undefined;
  const stepMin = scheduleCfg?.slotDuration ?? 30;

  const initialSchedules = getValues("schedules") ?? [];

  const [ranges, setRanges] = useState<ScheduleRange[]>(() =>
    initialSchedules
      .filter((s) => s?.weekday && s?.startTime && s?.endTime)
      .map((s) => ({
        weekday: Number(s.weekday),
        startMin: timeToMinutes(s.startTime),
        endMin: timeToMinutes(s.endTime),
      })),
  );

  // Whether the grid currently accepts one more click-to-place slot. Starts
  // true only when there's nothing picked yet, so a brand-new class can be
  // scheduled immediately without an extra click. Any further slot needs an
  // explicit "+ Add slot" press, and existing slots are edited by removing
  // (✕) and re-adding rather than dragging in place.
  const [isAddingSlot, setIsAddingSlot] = useState<boolean>(
    () => initialSchedules.length === 0,
  );
  const [draft, setDraft] = useState<DraftCell | null>(null);

  // The educator query stays disabled until an educator is picked, so
  // educatorClasses is undefined for most of this form's life. Gating the
  // grid on it alone hid the section's schedule entirely. Either source is
  // enough context to render the grid and pick free time.
  const hasEducator = educatorClasses !== undefined;
  const hasSection = sectionClasses !== undefined;
  const hasContext = hasEducator || hasSection;
  const atCap = maxSlots != null && ranges.length >= maxSlots;
  const canAddMore = !atCap;

  useEffect(() => {
    const now = getValues("schedules") ?? [];
    const next = ranges.map((r) => ({
      weekday: String(r.weekday),
      startTime: minutesToTime(r.startMin),
      endTime: minutesToTime(r.endMin),
    }));
    if (next.length !== now.length || next.some((s, i) =>
      now[i]?.weekday !== s.weekday || now[i]?.startTime !== s.startTime || now[i]?.endTime !== s.endTime,
    )) {
      setValue("schedules", next, { shouldDirty: true });
    }
  }, [ranges, setValue, getValues]);

  const educatorTaken = useMemo(() => toTaken(educatorClasses), [educatorClasses]);
  const sectionTaken = useMemo(() => toTaken(sectionClasses), [sectionClasses]);

  // Merge both sources for the visual grid — every block contending for
  // either the educator's week or the section's week shows up in one place.
  // Each block's own subject/section sublabel (from WeeklyScheduleGrid)
  // already distinguishes "this is the educator's other class" from "this is
  // the section's other class" without needing extra color-coding.
  const gridClasses = useMemo(() => {
    const map = new Map<string, Class>();
    for (const cls of educatorClasses ?? []) map.set(cls.id, cls);
    for (const cls of sectionClasses ?? []) map.set(cls.id, cls);
    return Array.from(map.values());
  }, [educatorClasses, sectionClasses]);

  // Tag each block by which source(s) contributed it, so a section block is
  // visually distinct from an educator's busy time — and a class contended by
  // both is flagged in red.
  const classTags = useMemo(() => {
    const tags: Record<string, ScheduleSource> = {};
    for (const c of sectionClasses ?? []) tags[c.id] = "section";
    for (const c of educatorClasses ?? []) {
      tags[c.id] = tags[c.id] === "section" ? "both" : "educator";
    }
    return tags;
  }, [educatorClasses, sectionClasses]);

  // Only advertise a legend entry for a source that is actually loaded,
  // otherwise "Section & educator" would appear before an educator is picked.
  const legendKeys: ScheduleSource[] = [
    ...(hasSection ? (["section"] as const) : []),
    ...(hasEducator ? (["educator"] as const) : []),
    ...(hasSection && hasEducator ? (["both"] as const) : []),
  ];

  const outOfWindow = useMemo(() => {
    if (windowStartMin === undefined || windowEndMin === undefined) return false;
    return ranges.some(
      (r) =>
        r.startMin < windowStartMin ||
        r.endMin > windowEndMin ||
        (r.startMin - windowStartMin) % stepMin !== 0 ||
        (r.endMin - windowStartMin) % stepMin !== 0,
    );
  }, [ranges, windowStartMin, windowEndMin, stepMin]);

  const hasEducatorConflict = useMemo(
    () =>
      ranges.some((r) =>
        educatorTaken.some((t) =>
          slotsOverlap(
            { weekday: r.weekday, startTime: minutesToTime(r.startMin), endTime: minutesToTime(r.endMin) },
            t,
          ),
        ),
      ),
    [ranges, educatorTaken],
  );

  const hasSectionConflict = useMemo(
    () =>
      ranges.some((r) =>
        sectionTaken.some((t) =>
          slotsOverlap(
            { weekday: r.weekday, startTime: minutesToTime(r.startMin), endTime: minutesToTime(r.endMin) },
            t,
          ),
        ),
      ),
    [ranges, sectionTaken],
  );

  useEffect(() => {
    onConflictsChange?.({
      educator: hasEducatorConflict || outOfWindow,
      section: hasSectionConflict || outOfWindow,
    });
  }, [hasEducatorConflict, hasSectionConflict, outOfWindow, onConflictsChange]);

  const handlePickRange = (range: ScheduleRange): void => {
    setRanges((prev) => [...prev, range]);
    setDraft(null);
    setIsAddingSlot(false);
  };

  const handleRemoveSlot = (index: number): void => {
    setRanges((prev) => prev.filter((_, i) => i !== index));
    setDraft(null);
  };

  const handleAddSlotClick = (): void => {
    if (!canAddMore) return;
    setIsAddingSlot(true);
    setDraft(null);
  };

  const hint = !hasContext
    ? "Select a section first."
    : !isAddingSlot
      ? canAddMore
        ? 'Click "+ Add slot" to schedule a time.'
        : `Maximum of ${maxSlots} slot${maxSlots === 1 ? "" : "s"} reached.`
      : draft
        ? "Click a free end time to finish this slot."
        : hasEducator
          ? "Click a free day & time for the start."
          : "Click a free time. Select an educator to also avoid their busy times.";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAddSlotClick}
          disabled={!hasContext || isAddingSlot || !canAddMore}
          className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
        >
          + Add slot
        </button>
        <span className="text-xs text-muted-foreground not-interactive">{hint}</span>
      </div>

      {ranges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ranges.map((range, index) => (
            <div
              key={`${range.weekday}-${range.startMin}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
            >
              <span className="not-interactive">
                {WEEKDAY_LABELS[range.weekday]} {minutesToDisplayLabel(range.startMin)}–
                {minutesToDisplayLabel(range.endMin)}
              </span>
              <button
                type="button"
                aria-label="Remove slot"
                onClick={() => handleRemoveSlot(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!hasContext && !isLoading ? (
        <div className="flex items-center justify-center border rounded-md py-8 text-sm text-muted-foreground">
          Select a section to view its schedule, then an educator to see their availability.
        </div>
      ) : (
        <>
          <WeeklyScheduleGrid
            classes={gridClasses}
            classTags={classTags}
            isLoading={isLoading || cfgLoading || !scheduleCfg}
            interactive
            showAllDays
            pickedRanges={ranges}
            maxPicks={isAddingSlot ? ranges.length + 1 : ranges.length}
            draftStart={draft}
            windowStartMin={windowStartMin}
            windowEndMin={windowEndMin}
            stepMin={stepMin}
            onDraftStart={setDraft}
            onPickRange={handlePickRange}
          />
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground not-interactive">
            {legendKeys.map((k) => (
              <span key={k} className="inline-flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-sm border ${SOURCE_STYLES[k]}`} />
                {SOURCE_LABELS[k]}
              </span>
            ))}
          </div>
        </>
      )}

      {hasEducatorConflict && (
        <p className="text-xs text-destructive">
          Conflicts with the educator&apos;s existing schedule. Pick a different day/time.
        </p>
      )}
      {hasSectionConflict && (
        <p className="text-xs text-destructive">
          Conflicts with this section&apos;s existing schedule. Pick a different day/time.
        </p>
      )}
    </div>
  );
}