"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAY_LABELS } from "@/utils/classes.utils";
import type { CreateClassForm } from "./CreateClassDialog";

export function ScheduleSlotFields() {
  const { register, watch, setValue, control } = useFormContext<CreateClassForm>();

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Schedule</Label>
        <button
          type="button"
          onClick={() => append({ weekday: "1", startTime: "08:00", endTime: "09:00" })}
          className="text-xs text-primary hover:underline"
        >
          + Add slot
        </button>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
        >
          <Select
            value={watch(`schedules.${index}.weekday`)}
            onValueChange={(v) => setValue(`schedules.${index}.weekday`, v ?? "")}
          >
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAY_LABELS.map((day, i) => (
                <SelectItem key={i} value={String(i)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="time"
            className="h-8 text-xs w-28"
            {...register(`schedules.${index}.startTime`)}
          />
          <span className="text-xs text-muted-foreground">–</span>
          <Input
            type="time"
            className="h-8 text-xs w-28"
            {...register(`schedules.${index}.endTime`)}
          />

          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}