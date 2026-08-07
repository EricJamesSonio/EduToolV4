"use client";

import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
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
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import {
  useCreateEnrollmentPeriod,
  useUpdateEnrollmentPeriod,
} from "@/hooks/admin/useEnrollmentPeriods";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import type { EnrollmentPeriod } from "@/types/enrollment-portal.types";

interface EnrollmentPeriodModalProps {
  open: boolean;
  onClose: () => void;
  schoolYearId?: string;
  existing?: EnrollmentPeriod | null;
}

function toLocalDate(d?: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
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

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setSyId(existing?.school_year?.id ?? schoolYearId ?? "");
    setStartDate(toLocalDate(existing?.start_date));
    setEndDate(toLocalDate(existing?.end_date));
    setLockDate(toLocalDate(existing?.lock_date));
  }, [open, existing, schoolYearId]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const formValid = !!name.trim() && !!syId && !!startDate && !!endDate && !!lockDate;

  const handleSubmit = async () => {
    if (!formValid) return;
    if (isEdit && existing) {
      await updateMutation.mutateAsync({
        id: existing.id,
        data: {
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          lock_date: lockDate,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: name.trim(),
        school_year_id: syId,
        start_date: startDate,
        end_date: endDate,
        lock_date: lockDate,
      });
    }
    onClose();
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-start">Opening date</Label>
            <Input
              id="ep-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-lock">Lock date</Label>
            <Input
              id="ep-lock"
              type="datetime-local"
              value={lockDate}
              onChange={(e) => setLockDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ep-end">Closing date</Label>
            <Input
              id="ep-end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
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