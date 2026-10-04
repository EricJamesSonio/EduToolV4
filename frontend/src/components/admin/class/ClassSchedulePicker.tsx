"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import Link from "next/link";
import { X } from "lucide-react";
import {
  WeeklyScheduleGrid,
  legendLabel,
  legendStyle,
  type DraftCell,
  type ScheduleRange,
  type ScheduleSource,
  type ScheduleTag,
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
import { roomUsageToClasses } from "@/utils/roomSchedule.utils";
import type { CreateClassForm } from "./CreateClassDialog.types";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";
import { useRooms, useRoomUsage } from "@/hooks/admin/useRooms";

export interface ScheduleConflictState {
  /** A picked slot overlaps one of the educator's other classes. */
  educator: boolean;
  /** A picked slot overlaps another class already scheduled for this section. */
  section: boolean;
  /** A picked slot's chosen room is already booked at that time. */
  room: boolean;
}

/** A picked slot, plus the optional room chosen for it. */
type PickedSlot = ScheduleRange & { roomId?: string };

interface ClassSchedulePickerProps {
  /** The selected educator's other classes this school year (drives one of the two conflict checks + grid blocks). */
  educatorClasses: Class[] | undefined;
  /** The selected section's other classes this school year (drives the other conflict check + grid blocks). Section is optional on a class, so this may be undefined/empty. */
  sectionClasses?: Class[] | undefined;
  isLoading?: boolean;
  /** Caps the number of slots. Omit for unlimited — grow with "+ Add slot". */
  maxSlots?: number;
  /** School year the room bookings are scoped to. Rooms are optional; without this the room picker is hidden. */
  schoolYearId?: string | null;
  /** The class being edited, so its own bookings don't show as conflicts with itself. */
  excludeClassId?: string;
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
  schoolYearId,
  excludeClassId,
  onConflictsChange,
}: ClassSchedulePickerProps) {
  const { getValues, setValue, watch } = useFormContext<CreateClassForm>();

  // The schedule is locked until both a subject and an educator are chosen.
  const subjectId = watch("subjectId");
  const educatorId = watch("educatorId");
  const scheduleReady = !!subjectId && !!educatorId;
  const missingLabel = [!subjectId && "a subject", !educatorId && "an educator"]
    .filter(Boolean)
    .join(" and ");

  // One source of truth for the school's operating window, active weekdays and
  // breaks. Previously this component fetched the org schedule config itself,
  // which meant the picker and every read-only timetable could drift apart.
  const {
    windowStartMin,
    windowEndMin,
    stepMin,
    activeWeekdays,
    blockedRanges,
  } = useScheduleWindow();
  const cfgLoading = false;

  const initialSchedules = getValues("schedules") ?? [];

  const [ranges, setRanges] = useState<PickedSlot[]>(() =>
    initialSchedules
      .filter((s) => s?.weekday && s?.startTime && s?.endTime)
      .map((s) => ({
        weekday: Number(s.weekday),
        startMin: timeToMinutes(s.startTime),
        endMin: timeToMinutes(s.endTime),
        roomId: s.roomId || undefined,
      })),
  );

  // Rooms live on their own page. When the org has none, the picker shows a
  // link to the Rooms page rather than an empty dropdown. Bookings power the
  // "already booked" grey-out, so they refetch often.
  //
  // The picker only needs names, so it deliberately uses the year-less cache
  // key (rooms.list(null)) — a different entry from the Rooms page's
  // slotCount-bearing list, which is a different shape.
  const { data: roomsData } = useRooms();
  const rooms = useMemo(() => roomsData ?? [], [roomsData]);
  const { data: usageData } = useRoomUsage(schoolYearId);
  const roomBookings = useMemo(
    () => (usageData ?? []).filter((u) => u.classId !== excludeClassId),
    [usageData, excludeClassId],
  );

  /**
   * Rooms chosen across the currently-picked slots. The grid only surfaces
   * occupancy for rooms you're actually using — showing every room in the org
   * would flood the timetable and stop you seeing the one you care about.
   *
   * Derived on the client from an already-fetched year of bookings, so
   * switching rooms re-renders instantly with no refetch.
   */
  const activeRoomIds = useMemo(
    () => [
      ...new Set(
        ranges.map((r) => r.roomId).filter((id): id is string => !!id),
      ),
    ],
    [ranges],
  );

  const activeRoomIdSet = useMemo(
    () => new Set(activeRoomIds),
    [activeRoomIds],
  );

  /** Bookings in the rooms currently selected on the picked slots. */
  const activeRoomBookings = useMemo(
    () =>
      roomBookings.filter(
        (u) => u.roomId !== null && activeRoomIdSet.has(u.roomId),
      ),
    [roomBookings, activeRoomIdSet],
  );

  /** True when `roomId` is already taken during this slot's time. */
  const isRoomBusy = (roomId: string, slot: PickedSlot): boolean =>
    roomBookings.some(
      (u) =>
        u.roomId === roomId &&
        slotsOverlap(
          {
            weekday: slot.weekday,
            startTime: minutesToTime(slot.startMin),
            endTime: minutesToTime(slot.endMin),
          },
          u,
        ),
    );

  /**
   * Why each picked slot can't be saved, or null when it's fine.
   *
   * Two distinct room failures, previously conflated:
   *  - "booked"  — the room is already taken by an existing class.
   *  - "duplicate" — two of THIS class's own slots claim the same room at
   *    overlapping times. The server would reject this on save, but the user
   *    should never be able to compose it in the first place.
   */
  const slotRoomIssues = useMemo<
    Array<{ kind: "booked" | "duplicate"; roomName: string } | null>
  >(() =>
    ranges.map((slot, index) => {
      if (!slot.roomId) return null;
      const roomName =
        rooms.find((r) => r.id === slot.roomId)?.name ?? "That room";

      if (isRoomBusy(slot.roomId, slot)) {
        return { kind: "booked", roomName };
      }

      // Compare against the user's OTHER slots, never itself.
      const clashes = ranges.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.roomId === slot.roomId &&
          slotsOverlap(
            {
              weekday: slot.weekday,
              startTime: minutesToTime(slot.startMin),
              endTime: minutesToTime(slot.endMin),
            },
            {
              weekday: other.weekday,
              startTime: minutesToTime(other.startMin),
              endTime: minutesToTime(other.endMin),
            },
          ),
      );

      return clashes ? { kind: "duplicate", roomName } : null;
    }),
    [ranges, roomBookings, rooms],
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

  // If the gate closes (subject or educator cleared) mid-selection, drop the
  // half-finished start cell. Slots already placed are kept.
  useEffect(() => {
    if (!scheduleReady) setDraft(null);
  }, [scheduleReady]);

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
      roomId: r.roomId ?? "",
    }));
    // roomId must be part of the comparison, otherwise choosing a room leaves
    // the form untouched (and the choice would be lost on submit).
    if (next.length !== now.length || next.some((s, i) =>
      now[i]?.weekday !== s.weekday ||
      now[i]?.startTime !== s.startTime ||
      now[i]?.endTime !== s.endTime ||
      (now[i]?.roomId ?? "") !== s.roomId,
    )) {
      setValue("schedules", next, { shouldDirty: true });
    }
  }, [ranges, setValue, getValues]);

  const educatorTaken = useMemo(() => toTaken(educatorClasses), [educatorClasses]);
  const sectionTaken = useMemo(() => toTaken(sectionClasses), [sectionClasses]);

  // Room bookings in the selected rooms, shaped for the grid. Only rooms the
  // user has actually chosen contribute, so the timetable stays readable.
  const roomGridClasses = useMemo(
    () => roomUsageToClasses(activeRoomBookings, schoolYearId ?? ""),
    [activeRoomBookings, schoolYearId],
  );

  // Merge every source for the visual grid — every block contending for the
  // educator's week, the section's week, or a selected room shows up in one
  // place. A class appearing in two sources is deduped to a single block.
  const gridClasses = useMemo(() => {
    const map = new Map<string, Class>();
    for (const cls of educatorClasses ?? []) map.set(cls.id, cls);
    for (const cls of sectionClasses ?? []) map.set(cls.id, cls);
    for (const cls of roomGridClasses) {
      const existing = map.get(cls.id);
      if (!existing) {
        map.set(cls.id, cls);
        continue;
      }
      // Already present via educator/section. That copy carries the real
      // subject/educator/section data, so KEEP it — but merge in any slots it
      // doesn't already have, so a class that is both in the section and booked
      // in the room still shows its room-assigned time. Cloned first: the
      // educator/section lists are query-cached props and must not be mutated.
      const known = new Set(existing.schedules.map((s) => s.id));
      const extra = cls.schedules.filter((s) => !known.has(s.id));
      if (extra.length) {
        map.set(existing.id, { ...existing, schedules: [...existing.schedules, ...extra] });
      }
    }
    return Array.from(map.values());
  }, [educatorClasses, sectionClasses, roomGridClasses]);

  // Tag each block by which source(s) contributed it. Multiple sources on one
  // class means it is contended, which the grid renders in the clash colour.
  const classTags = useMemo(() => {
    const tags: Record<string, ScheduleTag> = {};
    const add = (id: string, source: ScheduleSource): void => {
      const list = tags[id] ?? (tags[id] = []);
      if (!list.includes(source)) list.push(source);
    };

    for (const c of sectionClasses ?? []) add(c.id, "section");
    for (const c of educatorClasses ?? []) add(c.id, "educator");
    for (const c of roomGridClasses) add(c.id, "room");

    return tags;
  }, [educatorClasses, sectionClasses, roomGridClasses]);

  // Second line of each block. A block booked in a room always names that room
  // — otherwise a class that is both the section's and in a room reads as only
  // a section class, which is what made room clashes look like section clashes.
  const getBlockSublabel = useCallback(
    (cls: Class): string => {
      const tag = classTags[cls.id];
      if (tag?.includes("room")) {
        return cls.schedules.find((s) => s.roomName)?.roomName ?? "Room booked";
      }
      return cls.sectionName ?? "";
    },
    [classTags],
  );

  // Only advertise a legend entry for a source that is actually on the grid,
  // otherwise "Section" would appear before a section is picked.
  const hasRoom = roomGridClasses.length > 0;
  const legendKeys: Array<ScheduleSource | "contended"> = [
    ...(hasSection ? (["section"] as const) : []),
    ...(hasEducator ? (["educator"] as const) : []),
    ...(hasRoom ? (["room"] as const) : []),
    // "Conflicting" is shared by every multi-source block, so it appears once
    // whenever any two sources are present at the same time.
    ...(hasSection && hasEducator ? (["contended"] as const) : []),
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

  const conflictedPickIndexes = useMemo(
    () =>
      ranges.reduce<number[]>(
        (acc, _slot, index) => {
          if (slotRoomIssues[index]) acc.push(index);
          return acc;
        },
        [],
      ),
    [ranges, slotRoomIssues],
  );

  const hasRoomConflict = slotRoomIssues.some(Boolean);

  useEffect(() => {
    onConflictsChange?.({
      educator: hasEducatorConflict || outOfWindow,
      section: hasSectionConflict || outOfWindow,
      room: hasRoomConflict,
    });
  }, [
    hasEducatorConflict,
    hasSectionConflict,
    hasRoomConflict,
    outOfWindow,
    onConflictsChange,
  ]);

  const handleSetRoom = (index: number, roomId: string): void => {
    setRanges((prev) =>
      prev.map((r, i) => (i === index ? { ...r, roomId: roomId || undefined } : r)),
    );
  };

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
    if (!scheduleReady || !canAddMore) return;
    setIsAddingSlot(true);
    setDraft(null);
  };

  const hint = !scheduleReady
    ? `Select ${missingLabel} first.`
    : !hasContext
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
          disabled={!scheduleReady || !hasContext || isAddingSlot || !canAddMore}
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
              {rooms.length > 0 && (
                <select
                  value={range.roomId ?? ""}
                  onChange={(e) => handleSetRoom(index, e.target.value)}
                  aria-label="Room (optional)"
                  className="h-5 max-w-[7rem] rounded-sm border bg-background px-1 text-[11px]"
                >
                  <option value="">No room</option>
                  {rooms.map((room) => {
                    // A room that's already taken at this time can't be picked,
                    // so a room conflict is unreachable rather than just flagged.
                    const busy = room.id !== range.roomId && isRoomBusy(room.id, range);
                    return (
                      <option key={room.id} value={room.id} disabled={busy}>
                        {room.name}
                        {busy ? " (booked)" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
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
          <div
            className={scheduleReady ? undefined : "opacity-60"}
            aria-disabled={!scheduleReady}
          >
            <WeeklyScheduleGrid
              classes={gridClasses}
              classTags={classTags}
              getSublabel={getBlockSublabel}
              isLoading={isLoading || cfgLoading}
              interactive
              showAllDays
              pickedRanges={ranges}
              conflictedPickIndexes={conflictedPickIndexes}
              maxPicks={
                scheduleReady && isAddingSlot ? ranges.length + 1 : ranges.length
              }
              draftStart={draft}
              windowStartMin={windowStartMin}
              windowEndMin={windowEndMin}
              stepMin={stepMin}
              activeWeekdays={activeWeekdays}
              blockedRanges={blockedRanges}
              onDraftStart={setDraft}
              onPickRange={handlePickRange}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground not-interactive">
            {legendKeys.map((k) => (
              <span key={k} className="inline-flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-sm border ${legendStyle(k)}`} />
                {legendLabel(k)}
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
      {hasRoomConflict && (
        <>
          <p className="text-xs text-destructive">
            {slotRoomIssues.some((i) => i?.kind === "duplicate")
              ? "Two of your slots use the same room at overlapping times. Give one of them a different room or time."
              : "A selected room is already booked at that time. Pick a different room or time."}
          </p>
          {/* Name the exact room and slot, so a room clash is never mistaken
              for a section/educator one. */}
          <ul className="space-y-0.5">
            {slotRoomIssues.map((issue, index) =>
              issue ? (
                <li key={index} className="text-xs text-destructive">
                  {WEEKDAY_LABELS[ranges[index].weekday]}{" "}
                  {minutesToDisplayLabel(ranges[index].startMin)}–
                  {minutesToDisplayLabel(ranges[index].endMin)} — {issue.roomName}{" "}
                  {issue.kind === "duplicate"
                    ? "is used by another of your slots at that time."
                    : "is already booked at that time."}
                </li>
              ) : null,
            )}
          </ul>
        </>
      )}

      {/* Rooms live on their own page. When the org has none, say so and point
          there rather than showing a dropdown with nothing in it. */}
      {rooms.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Rooms are optional.{" "}
          <Link
            href="/admin/rooms"
            className="text-primary underline underline-offset-2"
          >
            Add rooms
          </Link>{" "}
          to assign one to a slot.
        </p>
      )}
    </div>
  );
}