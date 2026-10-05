"use client";

import { Label } from "@/components/ui/label";
import { ClassSchedulePicker, type ScheduleConflictState } from "./ClassSchedulePicker";
import type { Class } from "@/types/admin/class.types";

interface ScheduleSlotFieldsProps {
  /** Fetched classes of the currently selected educator (same school year). */
  educatorClasses: Class[] | undefined;
  /** Fetched classes of the currently selected section (same school year). Section is optional. */
  sectionClasses?: Class[] | undefined;
  /** True while the educator's/section's classes are being fetched. */
  isLoading?: boolean;
  /** Caps the number of slots. Omit for unlimited. */
  maxSlots?: number;
  /** School year the room bookings are scoped to. Rooms are optional. */
  schoolYearId?: string | null;
  /** The class being edited, excluded from its own conflict checks. */
  excludeClassId?: string;
  /** Fired with the current educator/section/room conflict state whenever a pick changes. */
  onConflictsChange?: (conflicts: ScheduleConflictState) => void;
}

export function ScheduleSlotFields({
  educatorClasses,
  sectionClasses,
  isLoading,
  maxSlots,
  schoolYearId,
  excludeClassId,
  onConflictsChange,
}: ScheduleSlotFieldsProps) {
  return (
    <div className="space-y-2">
      <Label>Schedule</Label>
      <ClassSchedulePicker
        educatorClasses={educatorClasses}
        sectionClasses={sectionClasses}
        isLoading={isLoading}
        maxSlots={maxSlots}
        schoolYearId={schoolYearId}
        excludeClassId={excludeClassId}
        onConflictsChange={onConflictsChange}
      />
    </div>
  );
}