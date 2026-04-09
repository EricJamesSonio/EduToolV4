import { useState } from "react";
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
import { Plus, X, GripVertical } from "lucide-react";
import type { AxiosError } from "axios";
import type { SemesterTemplate } from "@/types/admin/semester-template.types";
import {
  useCreateSemesterTemplate,
  useUpdateSemesterTemplate,
} from "@/hooks/admin/useSemesterTemplate";

interface LocalTerm {
  name: string;
}

interface LocalSemester {
  name: string;
  terms: LocalTerm[];
}

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: SemesterTemplate;
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
}: TemplateFormDialogProps): React.JSX.Element {
  const isEdit = !!template;
  const createMutation = useCreateSemesterTemplate();
  const updateMutation = useUpdateSemesterTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [name, setName] = useState(template?.name ?? "");
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
    return [
      { name: "1st Semester", terms: [{ name: "Midterm" }, { name: "Finals" }] },
      { name: "2nd Semester", terms: [{ name: "Midterm" }, { name: "Finals" }] },
    ];
  });

  const addSemester = () =>
    setSemesters((prev) => [
      ...prev,
      {
        name: `${prev.length + 1}${["st", "nd", "rd"][prev.length] ?? "th"} Semester`,
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
          ? { ...s, terms: [...s.terms, { name: `Term ${s.terms.length + 1}` }] }
          : s
      )
    );

  const removeTerm = (si: number, ti: number) =>
    setSemesters((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, terms: s.terms.filter((_, j) => j !== ti) } : s
      )
    );

  const updateTermName = (si: number, ti: number, val: string) =>
    setSemesters((prev) =>
      prev.map((s, i) =>
        i === si
          ? { ...s, terms: s.terms.map((t, j) => (j === ti ? { name: val } : t)) }
          : s
      )
    );

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Template name is required.");
    if (semesters.length === 0) return toast.error("Add at least one semester.");
    const semestersDto = toSemesterDto(semesters);

    if (isEdit) {
      updateMutation.mutate(
        { id: template.id, dto: { name: name.trim(), semesters: semestersDto } },
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
        { name: name.trim(), semesters: semestersDto },
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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Template" : "New Semester Template"}
          </DialogTitle>
          <DialogDescription>
            Templates are reusable across school years — assign them per program.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder='e.g. "Standard 2-Semester"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
                      onChange={(e) => updateSemesterName(si, e.target.value)}
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

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}