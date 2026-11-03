"use client";

import { FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleSlotFields } from "./ScheduleSlotFields";
import { CreateClassFormFields } from "./CreateClassFormFields";
import { useCreateClassForm } from "./hooks/useCreateClassForm";
import type { CreateClassDialogProps } from "./CreateClassDialog.types";

export function CreateClassDialog({
  open,
  onClose,
  defaultSubjectId,
  schoolYearId,
  schoolYearName,
  defaultProgramId,
  defaultSemesterId,
  defaultTrackId,
  defaultLevelId,
  defaultSectionId,
}: CreateClassDialogProps): React.JSX.Element {
  const router = useRouter();

  const {
    methods,
    data,
    hasDraft,
    presetActive,
    programChosenByUser,
    handleProgramChange,
    takenSubjectIds,
    subjectAlreadyHasClass,
    selectionGate,
    isSubmitting,
    isSubmitDisabled,
    onSubmit,
    handleDiscard,
    handleScheduleConflictsChange,
  } = useCreateClassForm({
    open,
    onClose,
    schoolYearId,
    defaultSubjectId,
    defaultProgramId,
    defaultSemesterId,
    defaultTrackId,
    defaultLevelId,
    defaultSectionId,
  });

function handleGoToSemesterSettings(): void {
  onClose();
  router.push("/admin/semester-settings");
}

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      className="w-[92vw] lg:w-[90vw] xl:max-w-6xl h-[85vh] lg:h-[90vh] max-h-[90vh] overflow-hidden flex flex-col"
      title={
        <span className="flex items-center gap-2">
          New Class
          {hasDraft && (
            <Badge variant="secondary" className="text-xs font-normal">
              Draft restored
            </Badge>
          )}
          {presetActive && (
            <Badge variant="secondary" className="text-xs font-normal">
              Preset applied
            </Badge>
          )}
        </span>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 flex-1 min-h-0">
            {/* LEFT — form fields, own scroll region */}
            <div className="overflow-y-auto md:pr-6 md:border-r">
              <CreateClassFormFields
                schoolYearId={schoolYearId}
                schoolYearName={schoolYearName}
                data={data}
                programChosenByUser={programChosenByUser}
                onProgramChange={handleProgramChange}
                takenSubjectIds={takenSubjectIds}
                subjectAlreadyHasClass={subjectAlreadyHasClass}
                onGoToSemesterSettings={handleGoToSemesterSettings}
              />
            </div>

            {/* RIGHT — schedule, own scroll region */}
            <div className="overflow-y-auto">
              <ScheduleSlotFields
                educatorClasses={data.educatorClasses}
                sectionClasses={data.sectionClasses}
                isLoading={data.educatorClassesLoading}
                schoolYearId={schoolYearId}
                selectionGate={selectionGate}
                onConflictsChange={handleScheduleConflictsChange}
              />
            </div>
          </div>

          {/* Footer pinned outside the scrolling grid */}
          <div className="flex justify-end gap-2 pt-4 mt-2 border-t shrink-0">
            <Button type="button" variant="ghost" onClick={handleDiscard} disabled={isSubmitting}>
              Discard
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Save &amp; Close
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}