import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import { programApi } from "@/api/admin/program.api";
import type { Semester } from "@/types/admin/semester.types";
import type { TermInput, SemesterSlot } from "@/api/admin/semester.api";
import { SemesterTermEditor } from "./SemesterTermEditor";
import { validateSemester, type SemesterDraft } from "./semester.validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { AxiosError } from "axios";

interface SemesterFormDialogProps {
  open: boolean;
  onClose: () => void;
  semester?: Semester;
}

const EMPTY_DRAFT: SemesterDraft = {
  name: "",
  startDate: "",
  endDate: "",
  terms: [],
};

/**
 * Normalise any date string the backend might return into YYYY-MM-DD,
 * which is what <input type="date"> requires.
 *
 * Handles:
 *   "2024-08-01T00:00:00.000Z"  → "2024-08-01"
 *   "2024-08-01"                → "2024-08-01"  (no-op)
 *   ""  | null | undefined      → ""
 */
function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // ISO datetime — slice the date part
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function SemesterFormDialog({
  open,
  onClose,
  semester,
}: SemesterFormDialogProps) {
  const isEdit = !!semester;

  const [draft, setDraft] = useState<SemesterDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ReturnType<typeof validateSemester>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [schoolYearId, setSchoolYearId] = useState("");
  const [programId, setProgramId] = useState("");

  // Seed draft on open
  useEffect(() => {
    if (open) {
      if (!isEdit) {
        const savedDraft = localStorage.getItem("semesterDraft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft) as SemesterDraft & {
            schoolYearId?: string;
          };
          setDraft(parsed);
          setProgramId(parsed.programId ?? "");
          if (parsed.schoolYearId) setSchoolYearId(parsed.schoolYearId);
        } else {
          setDraft(EMPTY_DRAFT);
          setProgramId("");
        }
      } else if (semester) {
        // Normalise dates → YYYY-MM-DD so <input type="date"> shows them correctly
        setDraft({
          id: semester.id,
          name: semester.name,
          startDate: toDateInput(semester.startDate),
          endDate: toDateInput(semester.endDate),
          terms: semester.terms.map((t) => ({
            id: t.id,
            name: t.name,
            orderIndex: t.orderIndex,
            startDate: toDateInput(t.startDate),
            endDate: toDateInput(t.endDate),
          })),
        });
      }
      setErrors({});
      setSubmitted(false);
    }
  }, [open, semester, isEdit]);

  const { data: schoolYears = [] } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
    { enabled: open && !isEdit },
  );

  // Programs for the chosen school year — a semester must belong to one.
  const { data: programsRaw } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId),
    { enabled: open && !isEdit && !!schoolYearId },
  );
  const programs = (programsRaw ?? []) as { id: string; name: string }[];

  // Reset program + slot selection whenever school year changes.
  useEffect(() => {
    if (!isEdit) {
      setProgramId("");
      setDraft((d) => ({ ...d, templateSemesterId: undefined, name: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYearId]);

  // The program's template-defined slots (e.g. 1st/2nd Semester, or 3 for
  // tri-sem) — this replaces free-text naming. Only slots with no Semester
  // created yet for this school year are selectable.
  const { data: slots = [], isLoading: slotsLoading } = useAsyncQuery(
    [...queryKeys.admin.semesters.all, 'slots', programId, schoolYearId] as const,
    () => semesterApi.getSemesterSlots(programId, schoolYearId),
    { enabled: open && !isEdit && !!programId && !!schoolYearId },
  );
  const availableSlots = (slots as SemesterSlot[]).filter((s) => !s.existingSemesterId);
  const noTemplateAssigned = !slotsLoading && !!programId && slots.length === 0;
  const allSlotsFilled = !slotsLoading && slots.length > 0 && availableSlots.length === 0;

  const handleSelectProgram = (v: string) => {
    setProgramId(v ?? "");
    setDraft((d) => ({ ...d, templateSemesterId: undefined, name: "" }));
  };

  const handleSelectSlot = (templateSemesterId: string) => {
    const slot = availableSlots.find((s) => s.templateSemesterId === templateSemesterId);
    if (!slot) return;
    patch("templateSemesterId", slot.templateSemesterId);
    // Pre-fill the display name from the template slot; still editable —
    // this is a label only now, not what resolution depends on.
    patch("name", slot.name);
  };

  const patch = (key: keyof SemesterDraft, value: unknown) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value } as SemesterDraft;
      if (submitted) setErrors(validateSemester(next));
      if (!isEdit) {
        localStorage.setItem(
          "semesterDraft",
          JSON.stringify({ ...next, schoolYearId, programId }),
        );
      }
      return next;
    });
  };

  const createMutation = useMutationWithInvalidation(
    () =>
      semesterApi.create({
        schoolYearId,
        programId,
        templateSemesterId: draft.templateSemesterId!,
        name: draft.name,
        startDate: draft.startDate,
        endDate: draft.endDate,
        terms: draft.terms as TermInput[],
      }),
    {
      invalidateKeys: [queryKeys.admin.semesters.list()],
      onSuccess: () => {
        toast.success("Semester created.");
        localStorage.removeItem("semesterDraft");
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(
          err?.response?.data?.message ?? "Failed to create semester.",
        );
      },
    },
  );

  const updateMutation = useMutationWithInvalidation(
    () =>
      semesterApi.update(semester!.id, {
        name: draft.name,
        startDate: draft.startDate,
        endDate: draft.endDate,
        terms: draft.terms as TermInput[],
      }),
    {
      invalidateKeys: [queryKeys.admin.semesters.list()],
      onSuccess: () => {
        toast.success("Semester updated.");
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(
          err?.response?.data?.message ?? "Failed to update semester.",
        );
      },
    },
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    setSubmitted(true);
    const errs = validateSemester(draft);

    if (!isEdit) {
      if (!schoolYearId || !programId || !draft.templateSemesterId) {
        setErrors(errs);
        return;
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleCloseClick = () => {
    const hasData =
      draft.name || draft.startDate || draft.endDate || draft.terms.length > 0;
    if (!isEdit && hasData) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = (saveDraft: boolean) => {
    if (!saveDraft) {
      localStorage.removeItem("semesterDraft");
    }
    setShowCloseConfirm(false);
    onClose();
  };

  const isSubmitDisabled =
    isPending ||
    (!isEdit && (!schoolYearId || !programId || !draft.templateSemesterId));

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) handleCloseClick();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Semester" : "New Semester"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-1">
            {/* School Year — create only */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>School Year</Label>
                <Select
                  value={schoolYearId}
                  onValueChange={(v) => setSchoolYearId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school year">
                      {schoolYearId
                        ? (schoolYears.find((sy) => sy.id === schoolYearId)
                            ?.name ?? "Select school year")
                        : "Select school year"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((sy) => (
                      <SelectItem key={sy.id} value={sy.id}>
                        {sy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitted && !schoolYearId && (
                  <p className="text-xs text-destructive">
                    School year is required.
                  </p>
                )}
              </div>
            )}

            {/* Program — create only. A semester belongs to exactly one
                program: its own calendar, its own template, its own dates. */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={programId}
                  onValueChange={handleSelectProgram}
                  disabled={!schoolYearId}
                >
                  <SelectTrigger>
                    <span>
                      {!schoolYearId
                        ? "Select a school year first"
                        : (programs.find((p) => p.id === programId)?.name ??
                            "Select department")}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitted && !programId && (
                  <p className="text-xs text-destructive">
                    Department is required.
                  </p>
                )}
              </div>
            )}

            {/* Semester slot — replaces free-text naming. Picking a slot is
                what ties this Semester to the department's actual template,
                so a "1st Semester" here can never drift from what that
                department's template calls its first semester. */}
            {!isEdit && programId && (
              <div className="space-y-1.5">
                <Label>Semester</Label>
                {noTemplateAssigned ? (
                  <p className="text-xs text-destructive">
                    This department has no semester template assigned yet.
                    Assign one in Semester Settings before creating a semester.
                  </p>
                ) : allSlotsFilled ? (
                  <p className="text-xs text-muted-foreground">
                    All semesters for this department already exist for this
                    school year.
                  </p>
                ) : (
                  <>
                    <Select
                      value={draft.templateSemesterId ?? ""}
                      onValueChange={handleSelectSlot}
                      disabled={slotsLoading}
                    >
                      <SelectTrigger>
                        <span>
                          {slotsLoading
                            ? "Loading…"
                            : (availableSlots.find(
                                (s) => s.templateSemesterId === draft.templateSemesterId,
                              )?.name ?? "Select semester")}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((s) => (
                          <SelectItem key={s.templateSemesterId} value={s.templateSemesterId}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {submitted && !draft.templateSemesterId && (
                      <p className="text-xs text-destructive">
                        Select which semester this is for this department.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Name — display label only now. Pre-filled from the chosen
                slot, still editable, but no longer used to match/resolve
                anything — program_id + templateSemesterId do that. */}
            {(isEdit || draft.templateSemesterId) && (
              <div className="space-y-1.5">
                <Label>Semester Name</Label>
                <Input
                  placeholder="e.g. 1st Semester"
                  value={draft.name}
                  onChange={(e) => patch("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            {/* Date range */}
            {(isEdit || draft.templateSemesterId) && (
              <div className="space-y-1.5">
                <Label>Semester date range</Label>
                <DateRangePicker
                  startDate={draft.startDate}
                  endDate={draft.endDate}
                  onChange={({ startDate, endDate }) => {
                    setDraft((prev) => {
                      const next = { ...prev, startDate, endDate };
                      if (submitted) setErrors(validateSemester(next));
                      if (!isEdit) {
                        localStorage.setItem(
                          "semesterDraft",
                          JSON.stringify({ ...next, schoolYearId, programId }),
                        );
                      }
                      return next;
                    });
                  }}
                />
                {(errors.startDate || errors.endDate || errors.dateRange) && (
                  <p className="text-xs text-destructive">
                    {errors.startDate ?? errors.endDate ?? errors.dateRange}
                  </p>
                )}
              </div>
            )}

            {/* Terms */}
            {(isEdit || draft.templateSemesterId) && (
              <div className="space-y-2">
                <Label>Terms</Label>
                <div className="rounded-md border p-3">
                  <SemesterTermEditor
                    terms={draft.terms}
                    semesterStartDate={draft.startDate}
                    semesterEndDate={draft.endDate}
                    onChange={(terms) => patch("terms", terms)}
                    errors={errors.terms}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                {isPending
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Semester"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Close Dialog */}
      {showCloseConfirm && (
        <Dialog open={true} onOpenChange={() => setShowCloseConfirm(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Draft?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p>
                You have unsaved changes. Do you want to save them as a draft?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => confirmClose(false)}>
                  Discard
                </Button>
                <Button onClick={() => confirmClose(true)}>Save Draft</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}