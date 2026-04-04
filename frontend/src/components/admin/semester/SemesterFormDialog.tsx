import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { semesterApi } from "@/api/admin/semester.api";
import type { Semester } from "@/types/admin/semester.types";
import type { TermInput } from "@/api/admin/semester.api";
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
import { useQuery } from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";
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
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<SemesterDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ReturnType<typeof validateSemester>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Seed draft on open
  useEffect(() => {
    if (open) {
      if (!isEdit) {
        const savedDraft = localStorage.getItem("semesterDraft");
        if (savedDraft) {
          setDraft(JSON.parse(savedDraft));
        } else {
          setDraft(EMPTY_DRAFT);
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

  const { data: schoolYears = [] } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
    enabled: open && !isEdit,
  });

  const [schoolYearId, setSchoolYearId] = useState("");

  const patch = (key: keyof SemesterDraft, value: unknown) => {
    const next = { ...draft, [key]: value } as SemesterDraft;
    setDraft(next);
    if (submitted) setErrors(validateSemester(next));
    if (!isEdit) localStorage.setItem("semesterDraft", JSON.stringify(next));
  };

  const createMutation = useMutation({
    mutationFn: () =>
      semesterApi.create({
        schoolYearId,
        name: draft.name,
        startDate: draft.startDate,
        endDate: draft.endDate,
        terms: draft.terms as TermInput[],
      }),
    onSuccess: () => {
      toast.success("Semester created.");
      localStorage.removeItem("semesterDraft");
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to create semester.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      semesterApi.update(semester!.id, {
        name: draft.name,
        startDate: draft.startDate,
        endDate: draft.endDate,
        terms: draft.terms as TermInput[],
      }),
    onSuccess: () => {
      toast.success("Semester updated.");
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update semester.");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    setSubmitted(true);
    const errs = validateSemester(draft);
    if (!isEdit && !schoolYearId) {
      setErrors({ ...errs });
      return;
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

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleCloseClick(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Semester" : "New Semester"}</DialogTitle>
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
                        ? (schoolYears.find((sy) => sy.id === schoolYearId)?.name ?? "Select school year")
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

            {/* Name */}
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

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => patch("startDate", e.target.value)}
                />
                {(errors.startDate || errors.dateRange) && (
                  <p className="text-xs text-destructive">
                    {errors.startDate ?? errors.dateRange}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => patch("endDate", e.target.value)}
                />
                {errors.endDate && (
                  <p className="text-xs text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Terms */}
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

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
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