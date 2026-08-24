import { AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ReadinessIssue } from "./types";

export function ReadinessDialog({
  open,
  onOpenChange,
  issues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: ReadinessIssue[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cannot Lock Grades
          </DialogTitle>
          <DialogDescription>
            The following issues must be resolved before grades can be locked.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {issues.map((issue, i) => (
            <div key={i} className="rounded-lg border bg-card p-3 text-sm">
              {issue.type === "missing_submission" && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-5 h-5 rounded bg-destructive/15 text-destructive flex items-center justify-center text-[10px] font-bold shrink-0">M</div>
                  <div>
                    <p className="font-medium">
                      {issue.studentName}
                      <span className="font-normal text-muted-foreground"> — {issue.assessmentTitle}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {issue.termName}
                      {issue.studentCode ? <> · {issue.studentCode}</> : null}
                    </p>
                  </div>
                </div>
              )}
              {issue.type === "missing_category_assessment" && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-5 h-5 rounded bg-warning/15 text-warning flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
                  <div>
                    <p className="font-medium">
                      No assessment for category: <span className="font-bold capitalize">{issue.category}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add at least one assessment of this type to the grading scheme.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
