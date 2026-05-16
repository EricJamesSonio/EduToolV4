// ===== File: frontend/src/components/admin/semester-settings/TermDatesModal.tsx =====
"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TermDatesPanel } from "./assign-row/term-dates-panel";
import { ConfirmDialog } from "./assign-row/confirm-dialog";
import { toDateInput } from "./assign-row/helpers";
import { useAssignRow } from "./assign-row/use-assign-row";
import type {
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";

interface TermDatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: {
    id: string;
    name: string;
    type: string;
    school_year_id: string;
    semesterAssignment: TemplateAssignment | null;
  };
  templates: SemesterTemplate[];
  schoolYearStart: string | null;
  schoolYearEnd: string | null;
}

export function TermDatesModal({
  open,
  onOpenChange,
  program,
  templates,
  schoolYearStart,
  schoolYearEnd,
}: TermDatesModalProps): React.JSX.Element {
  // ================= HOOKS =================
  const {
    current,
    assignedTemplate,
    allTerms,
    termDates,
    panelMode,
    setPanelMode,
    savingDates,
    validation,
    handleDateChange,
    handleRequestSave,
    handleSaveDates,
    handleCancelEdit,
    confirmSaveOpen,
    setConfirmSaveOpen,
  } = useAssignRow(program, templates);

  const syMin = schoolYearStart ? toDateInput(schoolYearStart) : "";
  const syMax = schoolYearEnd ? toDateInput(schoolYearEnd) : "";

  // Only show modal if there's a template assigned and has terms
  const hasTemplate = !!current && allTerms.length > 0;

  if (!hasTemplate) {
    return <></>;
  }

  return (
    <>
      <Dialog open={open && hasTemplate} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-5xl h-[90vh] overflow-hidden p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="text-xl">
                Configure Term Dates
              </DialogTitle>

              <DialogDescription>
                Set term dates for <strong>{program.name}</strong> using the{" "}
                <strong>
                  {assignedTemplate?.name ?? current.template.name}
                </strong>{" "}
                template.
                {schoolYearStart && schoolYearEnd && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    School year range:{" "}
                    <span className="font-medium text-foreground">
                      {new Date(schoolYearStart).toLocaleDateString()} –{" "}
                      {new Date(schoolYearEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <TermDatesPanel
                templateName={assignedTemplate?.name ?? current.template.name}
                allTerms={allTerms}
                termDates={termDates}
                isValid={validation.isValid}
                savingDates={savingDates}
                panelMode={panelMode}
                syMin={syMin}
                syMax={syMax}
                onDateChange={handleDateChange}
                onRequestSave={handleRequestSave}
                onCancelEdit={handleCancelEdit}
                onEnterEdit={() => setPanelMode("edit")}
                onClose={() => onOpenChange(false)}
              />
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={savingDates}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save dates confirm dialog */}
      <ConfirmDialog
        open={confirmSaveOpen}
        title="Save term dates?"
        description="This will overwrite any previously saved term dates for this program."
        confirmLabel="Save"
        onConfirm={handleSaveDates}
        onCancel={() => setConfirmSaveOpen(false)}
      />
    </>
  );
}
