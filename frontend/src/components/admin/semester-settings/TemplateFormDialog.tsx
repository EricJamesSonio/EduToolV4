import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal, ModalFooter } from "@/components/shared/Modal";
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
import { cn } from "@/lib/utils";
import { Plus, X, GripVertical } from "lucide-react";
import type { AxiosError } from "axios";
import type {
  SemesterTemplate,
  ProgramType,
} from "@/types/admin/semester-template.types";
import {
  useCreateSemesterTemplate,
  useUpdateSemesterTemplate,
} from "@/hooks/admin/useSemesterTemplate";
import {
  DEFAULT_TEMPLATES,
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_DESCRIPTIONS,
  PROGRAM_TYPE_COLORS,
  type LocalTerm,
  type LocalSemester,
} from "./semester-templates.constants";

/* =========================
   ERROR HANDLING
========================= */
const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong.";

/* =========================
   UTILITIES
========================= */
function toSemesterDto(semesters: LocalSemester[]) {
  return semesters.map((s, si) => ({
    name: s.name,
    orderIndex: si + 1,
    terms: s.terms.map((t, ti) => ({
      name: t.name,
      orderIndex: ti + 1,
    })),
  }));
}

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: SemesterTemplate;
  programType?: ProgramType;
}

export function TemplateFormDialog({
  open,
  onClose,
  template,
  programType: initialProgramType,
}: TemplateFormDialogProps): React.JSX.Element {
  const isEdit = !!template;

  const createMutation = useCreateSemesterTemplate();
  const updateMutation = useUpdateSemesterTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(template?.name ?? "");
  const [programType, setProgramType] = useState<ProgramType | "">(
    initialProgramType ?? ""
  );

  const [semesters, setSemesters] = useState<LocalSemester[]>(() => {
    if (template?.semesters?.length) {
      return [...template.semesters]
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => ({
          name: s.name,
          terms: [...(s.terms ?? [])]
            .sort((a, b) => a.order_index - b.order_index)
            .map((t) => ({ name: t.name })),
        }));
    }

    if (initialProgramType) {
      return DEFAULT_TEMPLATES[initialProgramType];
    }

    return [];
  });

  /* =========================
     INIT / RESET
  ========================= */
  useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setProgramType(initialProgramType ?? "");

      if (template?.semesters?.length) {
        setSemesters(
          [...template.semesters]
            .sort((a, b) => a.order_index - b.order_index)
            .map((s) => ({
              name: s.name,
              terms: [...(s.terms ?? [])]
                .sort((a, b) => a.order_index - b.order_index)
                .map((t) => ({ name: t.name })),
            }))
        );
      } else if (initialProgramType) {
        setSemesters(DEFAULT_TEMPLATES[initialProgramType]);
      } else {
        setSemesters([]);
      }
    }
  }, [open, template, initialProgramType]);

  /* =========================
     ACTIONS
  ========================= */

  const addSemester = () =>
    setSemesters((prev) => [
      ...prev,
      {
        name: `${prev.length + 1}${
          ["st", "nd", "rd"][prev.length] ?? "th"
        } Semester`,
        terms: [],
      },
    ]);

  const removeSemester = (si: number) =>
    setSemesters((prev) => prev.filter((_, i) => i !== si));

  const updateSemesterName = (si: number, val: string) =>
    setSemesters((prev) =>
      prev.map((s, i) => (i === si ? { ...s, name: val } : s))
    );

  const addTerm = (si: number) =>
    setSemesters((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              terms: [...s.terms, { name: `Term ${s.terms.length + 1}` }],
            }
          : s
      )
    );

  const removeTerm = (si: number, ti: number) =>
    setSemesters((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, terms: s.terms.filter((_, j) => j !== ti) }
          : s
      )
    );

  const updateTermName = (si: number, ti: number, val: string) =>
    setSemesters((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              terms: s.terms.map((t, j) =>
                j === ti ? { name: val } : t
              ),
            }
          : s
      )
    );

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Template name is required.");
    if (!isEdit && !programType)
      return toast.error("Program type is required.");
    if (semesters.length === 0)
      return toast.error("Add at least one semester.");

    const semestersDto = toSemesterDto(semesters);

    if (isEdit) {
      updateMutation.mutate(
        {
          id: template.id,
          dto: { name: name.trim(), semesters: semestersDto },
        },
        {
          onSuccess: () => {
            toast.success("Template updated.");
            onClose();
          },
          onError: (e) => toast.error(errMsg(e)),
        }
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          programType: programType as ProgramType,
          semesters: semestersDto,
        },
        {
          onSuccess: () => {
            toast.success("Template created.");
            onClose();
          },
          onError: (e) => toast.error(errMsg(e)),
        }
      );
    }
  };

  /* ========================= */

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Template" : "New Semester Template"}
      description="Templates are reusable across school years — assign them per program."
      size="2xl"
    >

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder='e.g. "Standard 2-Semester"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {!isEdit && !initialProgramType && (
            <div className="space-y-1.5">
              <Label>
                Program Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={programType}
                onValueChange={(v) => {
                  setProgramType(v as ProgramType);
                  setSemesters(DEFAULT_TEMPLATES[v as ProgramType]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PROGRAM_TYPE_LABELS) as [
                    ProgramType,
                    string,
                  ][]).map(([value, label]) => {
                    const dotColor = ({
                      college: "bg-blue-500",
                      shs: "bg-violet-500",
                      jhs: "bg-amber-500",
                      elementary: "bg-emerald-500",
                      kinder: "bg-pink-500",
                      daycare: "bg-orange-500",
                      custom: "bg-slate-500",
                    } as Record<string, string>)[value] ?? "bg-gray-500";
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {PROGRAM_TYPE_DESCRIPTIONS[value]}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* SEMESTERS & TERMS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Semesters & Terms</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addSemester}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Semester
              </Button>
            </div>

            {semesters.length === 0 && (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No semesters yet — click &quot;Add Semester&quot; to start.
              </div>
            )}

            <div className="space-y-3">
              {semesters.map((sem, si) => (
                <div
                  key={si}
                  className="rounded-lg border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <Input
                      className="h-8 text-sm font-medium bg-background"
                      value={sem.name}
                      onChange={(e) =>
                        updateSemesterName(si, e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSemester(si)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="pl-6 space-y-2">
                    {sem.terms.map((term, ti) => (
                      <div key={ti} className="flex items-center gap-2">
                        <div className="h-px w-3 bg-border shrink-0" />
                        <Input
                          className="h-7 text-xs bg-background"
                          value={term.name}
                          onChange={(e) =>
                            updateTermName(si, ti, e.target.value)
                          }
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTerm(si, ti)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => addTerm(si)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add term
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? "Saving…"
              : isEdit
              ? "Save Changes"
              : "Create Template"}
          </Button>
        </ModalFooter>
    </Modal>
  );
}