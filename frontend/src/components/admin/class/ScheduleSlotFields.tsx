"use client";

import { Label } from "@/components/ui/label";
import { ClassSchedulePicker } from "./ClassSchedulePicker";
import type { Class } from "@/types/admin/class.types";

interface ScheduleSlotFieldsProps {
  /** Fetched classes of the currently selected educator (same school year). */
  educatorClasses: Class[] | undefined;
  /** True while the educator's classes are being fetched. */
  isLoading?: boolean;
  /** Fired with true whenever a slot overlaps an already-taken slot. */
  onConflictsChange?: (hasConflict: boolean) => void;
}

export function ScheduleSlotFields({
  educatorClasses,
  isLoading,
  onConflictsChange,
}: ScheduleSlotFieldsProps) {
  return (
    <div className="space-y-2">
      <Label>Schedule</Label>
      <ClassSchedulePicker
        educatorClasses={educatorClasses}
        isLoading={isLoading}
        onConflictsChange={onConflictsChange}
      />
    </div>
  );
}