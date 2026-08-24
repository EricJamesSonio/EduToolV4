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

function startOfDay(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateOnly(d?: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

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

  const startMs = startDate ? new Date(startDate).getTime() : null;
  const lockMs = lockDate ? new Date(lockDate).getTime() : null;
  const endMs = endDate ? new Date(endDate).getTime() : null;

  const syStartMs = selectedYear?.start_date ? new Date(selectedYear.start_date).getTime() : null;

  const datesUnavailable = !selectedYear || readiness?.ready !== true;
  const today = startOfDay(new Date().toISOString().slice(0, 10));
  const startDay = startDate ? startOfDay(startDate.slice(0, 10)) : null;
  const lockDay = lockDate ? startOfDay(lockDate.slice(0, 10)) : null;
  const syStartDay = selectedYear?.start_date
    ? startOfDay(String(selectedYear.start_date).slice(0, 10))
    : null;

  const lockError =
    startMs !== null && lockMs !== null && lockMs < startMs
      ? "Lock date must be after the opening date."
      : lockMs !== null && endMs !== null && lockMs >= endMs
        ? "Lock date must be before the closing date."
        : "";

  const endError =
    startMs !== null && endMs !== null && endMs <= startMs
      ? "Closing date must be after the opening date."
      : "";

  const schoolYearError =
    syStartMs !== null && endMs !== null && endMs >= syStartMs
      ? "Enrollment period must end strictly before the school year starts."
      : "";

  const dateHasError = !!lockError || !!endError || !!schoolYearError;
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
              disabled={(date) =>
                datesUnavailable ||
                date < today ||
                (syStartDay ? date >= syStartDay : false)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-lock">Lock date</Label>
            <DatePicker
              value={lockDate}
              onChange={setLockDate}
              disabled={(date) =>
                datesUnavailable ? true : startDay ? date < startDay : true
              }
            />
            {lockError && <p className="text-xs text-destructive">{lockError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-end">Closing date</Label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              disabled={(date) =>
                datesUnavailable ||
                (lockDay ? date < lockDay : true) ||
                (syStartDay ? date >= syStartDay : false)
              }
            />
            {endError && <p className="text-xs text-destructive">{endError}</p>}
            {schoolYearError && (
              <p className="text-xs text-destructive">{schoolYearError}</p>
            )}
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