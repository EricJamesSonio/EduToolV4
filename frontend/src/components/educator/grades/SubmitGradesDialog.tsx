"use client";

import { AlertTriangle, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ClassSubmissionStatus } from "@/api/educator/class-grade-submission.api";

const MAX_LISTED = 10;

export function SubmitGradesDialog({
  open,
  onOpenChange,
  status,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ClassSubmissionStatus | null;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  const ungraded = status?.ungraded ?? [];
  const shown = ungraded.slice(0, MAX_LISTED);
  const hidden = ungraded.length - shown.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Submit grades for this class
          </DialogTitle>
          <DialogDescription>
            Your current grades are written into the admin&apos;s grade
            template
            {status && status.templateCount > 1 ? "s" : ""} for this class. You
            can submit again later if grades change.
          </DialogDescription>
        </DialogHeader>

        {ungraded.length > 0 && (
          <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {ungraded.length} of {status?.totalStudents ?? 0} student(s) have
              no grade yet. Their cells will stay empty in the sheet.
            </p>
            <ul className="space-y-0.5">
              {shown.map((s) => (
                <li key={s.studentId}>
                  <span className="font-medium">{s.name}</span>
                  {s.code ? ` (${s.code})` : ""}
                  {s.missingTerms.length > 0 &&
                    ` — missing: ${s.missingTerms.join(", ")}`}
                </li>
              ))}
              {hidden > 0 && <li>and {hidden} more...</li>}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {ungraded.length > 0 ? "Submit anyway" : "Submit grades"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}