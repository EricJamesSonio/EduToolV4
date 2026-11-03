"use client";

import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAxiosError } from "axios";
import { AlertCircle, CircleAlert } from "lucide-react";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import {
  useCreateEnrollmentPeriod,
  useUpdateEnrollmentPeriod,
} from "@/hooks/admin/useEnrollmentPeriods";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { todayInZone, normalizeDateInput, formatCalendarDate } from "@/utils/datetime.util";
import type {
  EnrollmentPeriod,
  SectionOverflowAction,
} from "@/types/enrollment-portal.types";
import type { SchoolYearReadiness } from "@/types/admin/school-year.types";

const OVERFLOW_OPTIONS: { value: SectionOverflowAction; label: string; hint: string }[] = [
  { value: "no_section", label: "Approve without a section", hint: "Leave the student without a section and notify registrars." },
  { value: "auto_create", label: "Auto-create a section", hint: "Create a section for the level/course and assign the student." },
  { value: "expand_capacity", label: "Expand a section's capacity", hint: "Increase the fullest eligible section to fit the student." },
];

const OVERFLOW_LABELS = Object.fromEntries(
  OVERFLOW_OPTIONS.map((o) => [o.value, o.label]),
) as Record<SectionOverflowAction, string>;

interface EnrollmentPeriodModalProps {
  open: boolean;
  onClose: () => void;
  schoolYearId?: string;
  existing?: EnrollmentPeriod | null;
}

function toDateOnly(d?: string | null): string {
  // TICK-INFRA-017: normalize (legacy-ISO tolerant) — a blind slice or local
  // getters would load the wrong day for 16:00Z rows and submit it back.
  return normalizeDateInput(d);
}

/** "YYYY-MM-DD" label of a picker-local Date (wall-clock read). */
/* eslint-disable no-restricted-syntax -- wall-clock reads of picker-local Dates below (kind-B UI values, not instants). */
function toYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
/* eslint-enable no-restricted-syntax */

export function EnrollmentPeriodModal({
  open,
  onClose,
  schoolYearId,
  existing,
}: EnrollmentPeriodModalProps) {
  const isEdit = !!existing;
  const createMutation = useCreateEnrollmentPeriod();
  const updateMutation = useUpdateEnrollmentPeriod();
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  const [name, setName] = useState("");
  const [syId, setSyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lockDate, setLockDate] = useState("");
  const [overflowAction, setOverflowAction] = useState<SectionOverflowAction>("no_section");
  const [formError, setFormError] = useState<string | null>(null);

  const selectedYear = schoolYears.find((y) => y.id === syId);

  const { data: readiness } = useAsyncQuery<SchoolYearReadiness>(
    queryKeys.admin.schoolYears.readinessDetail(syId),
    () => schoolYearApi.getReadiness(syId),
    { enabled: !!syId },
  );

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setSyId(existing?.school_year?.id ?? schoolYearId ?? "");
    setStartDate(toDateOnly(existing?.start_date));
    setEndDate(toDateOnly(existing?.end_date));
    setLockDate(toDateOnly(existing?.lock_date));
    setOverflowAction(existing?.section_overflow_action ?? "no_section");
  }, [open, existing, schoolYearId]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  // TICK-INFRA-017: state holds same-shape "YYYY-MM-DD" strings, so plain
  // string order is chronological in every TZ. "Today" is the school day.
  const datesUnavailable = !selectedYear || readiness?.ready !== true;
  const today = todayInZone();
  const startDay = startDate ? startDate.slice(0, 10) : null;
  const endDay = endDate ? endDate.slice(0, 10) : null;

  const lockError =
    startDay !== null && lockDate && lockDate < startDay
      ? "Lock date must be after the opening date."
      : lockDate && endDay !== null && lockDate >= endDay
        ? "Lock date must be before the closing date."
        : "";

  const endError =
    startDay !== null && endDay !== null && endDay <= startDay
      ? "Closing date must be after the opening date."
      : "";

  const dateHasError = !!lockError || !!endError;
  const formValid =
    !!name.trim() && !!syId && !!startDate && !!endDate && !!lockDate &&
    !!selectedYear && !!readiness?.ready && !dateHasError;

  const handleSubmit = async () => {
    if (!formValid) return;
    setFormError(null);
    try {
      if (isEdit && existing) {
        await updateMutation.mutateAsync({
          id: existing.id,
          data: {
            name: name.trim(),
            start_date: startDate,
            end_date: endDate,
            lock_date: lockDate,
            section_overflow_action: overflowAction,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          school_year_id: syId,
          start_date: startDate,
          end_date: endDate,
          lock_date: lockDate,
          section_overflow_action: overflowAction,
        });
      }
      onClose();
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? "Failed to save the enrollment period.")
        : "Failed to save the enrollment period.";
      setFormError(typeof msg === "string" ? msg : "Failed to save the enrollment period.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            {isEdit ? "Update Enrollment Period" : "Create Enrollment Period"}
          </DialogTitle>
          <DialogDescription>
            Set the window applicants can apply. The lock date freezes applications for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ep-name">Name</Label>
            <Input
              id="ep-name"
              value={name}
              placeholder="e.g. Regular Batch"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>School Year</Label>
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={syId}
              onSelect={setSyId}
            />
            {selectedYear && readiness && !readiness.ready && (
              <p className="flex items-start gap-1.5 text-xs text-warning">
                <CircleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                This school year is not ready
                {readiness.blockingCount > 0
                  ? ` (${readiness.blockingCount} blocking). Fix it before creating a period.`
                  : ". Fix the warnings before creating a period."}
              </p>
            )}
            {datesUnavailable && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CircleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Select a ready school year to configure the enrollment dates.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-overflow">When all matching sections are full</Label>
            <Select
              value={overflowAction}
              onValueChange={(v) => setOverflowAction(v as SectionOverflowAction)}
            >
              <SelectTrigger id="ep-overflow" className="w-full">
                <SelectValue placeholder="Choose an action" />
              </SelectTrigger>
              <SelectContent>
                {OVERFLOW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {OVERFLOW_OPTIONS.find((o) => o.value === overflowAction)?.hint ??
                OVERFLOW_LABELS[overflowAction]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-start">Opening date</Label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              disabled={(date) => datesUnavailable || toYmd(date) < today}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-lock">Lock date</Label>
            <DatePicker
              value={lockDate}
              onChange={setLockDate}
              disabled={(date) =>
                datesUnavailable ||
                !startDay ||
                toYmd(date) < startDay ||
                (endDay ? toYmd(date) >= endDay : false)
              }
            />
            {lockError && <p className="text-xs text-destructive">{lockError}</p>}
            {!lockError && lockDate && (
              <p className="text-xs text-muted-foreground">
                The portal stays open through the end of{" "}
                {formatCalendarDate(lockDate)} (Manila time) and locks after
                midnight.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-end">Closing date</Label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              disabled={(date) => {
                if (datesUnavailable) return true;
                const day = toYmd(date);
                return lockDate ? day < lockDate : startDay ? day <= startDay : true;
              }}
            />
            {endError && <p className="text-xs text-destructive">{endError}</p>}
          </div>
        </div>

        <DialogFooter>
          {formError && (
            <p className="flex items-start gap-1.5 text-xs text-destructive mr-auto w-full">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {formError}
            </p>
          )}
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formValid || isPending}>
            {isPending ? "Saving…" : isEdit ? "Update Period" : "Create Period"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}