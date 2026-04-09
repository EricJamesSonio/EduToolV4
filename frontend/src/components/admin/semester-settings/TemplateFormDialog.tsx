import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

/* =========================
   ✅ HARD-CODED TEMPLATES
========================= */
interface LocalTerm {
  name: string;
}

interface LocalSemester {
  name: string;
  terms: LocalTerm[];
}

const DEFAULT_TEMPLATES: Record<ProgramType, LocalSemester[]> = {
  daycare: [
    { name: "Level 1", terms: [{ name: "1st Term" }, { name: "2nd Term" }] },
  ],
  kinder: [
    { name: "Kinder", terms: [{ name: "1st Term" }, { name: "2nd Term" }] },
  ],
  elementary: [
    {
      name: "Grade 1",
      terms: [
        { name: "1st Grading" },
        { name: "2nd Grading" },
        { name: "3rd Grading" },
        { name: "4th Grading" },
      ],
    },
  ],
  jhs: [
    {
      name: "Grade 7",
      terms: [
        { name: "1st Grading" },
        { name: "2nd Grading" },
        { name: "3rd Grading" },
        { name: "4th Grading" },
      ],
    },
  ],
  shs: [
    {
      name: "Grade 11 - 1st Sem",
      terms: [{ name: "Midterm" }, { name: "Finals" }],
    },
  ],
  college: [
    {
      name: "1st Semester",
      terms: [{ name: "Midterm" }, { name: "Finals" }],
    },
    {
      name: "2nd Semester",
      terms: [{ name: "Midterm" }, { name: "Finals" }],
    },
  ],
  custom: [],
};

/* ========================= */

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare: "Daycare",
  kinder: "Kinder",
  elementary: "Elementary",
  jhs: "Junior High School",
  shs: "Senior High School",
  college: "College",
  custom: "Custom",
};

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: SemesterTemplate;
  programType?: ProgramType;
}

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

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong.";

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

  const [name, setName] = useState("");
  const [programType, setProgramType] = useState<ProgramType | "">(
    initialProgramType ?? ""
  );

  const [semesters, setSemesters] = useState<LocalSemester[]>([]);

  /* =========================
     ✅ INIT / RESET STATE
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
      { name: `Semester ${prev.length + 1}`, terms: [] },
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
          ? { ...s, terms: [...s.terms, { name: `Term ${s.terms.length + 1}` }] }
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "New Semester Template"}
          </DialogTitle>
          <DialogDescription>
            Templates are reusable across school years.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {!isEdit && !initialProgramType && (
            <div>
              <Label>Program Type</Label>
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
                  {Object.entries(PROGRAM_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Semesters & Terms</Label>
              <Button size="sm" onClick={addSemester}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {semesters.map((sem, si) => (
              <div key={si} className="border p-3 rounded">
                <div className="flex gap-2">
                  <GripVertical className="h-4 w-4" />
                  <Input
                    value={sem.name}
                    onChange={(e) =>
                      updateSemesterName(si, e.target.value)
                    }
                  />
                  <Button onClick={() => removeSemester(si)}>
                    <X />
                  </Button>
                </div>

                <div className="pl-6 mt-2">
                  {sem.terms.map((t, ti) => (
                    <div key={ti} className="flex gap-2">
                      <Input
                        value={t.name}
                        onChange={(e) =>
                          updateTermName(si, ti, e.target.value)
                        }
                      />
                      <Button onClick={() => removeTerm(si, ti)}>
                        <X />
                      </Button>
                    </div>
                  ))}

                  <Button size="sm" onClick={() => addTerm(si)}>
                    Add Term
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}