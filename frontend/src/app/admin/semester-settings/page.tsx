"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  GripVertical,
  X,
  Layers,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import type { AxiosError } from "axios";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import type {
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";
import {
  useSemesterTemplates,
  useCreateSemesterTemplate,
  useUpdateSemesterTemplate,
  useDeleteSemesterTemplate,
  useTemplateAssignments,
  useAssignTemplate,
  useRemoveTemplateAssignment,
} from "@/hooks/admin/useSemesterTemplate";
import { useQuery } from "@tanstack/react-query";
import clientApi from "@/api/client";

interface Program {
  id: string;
  name: string;
  type: string;
  school_year_id: string;
}

interface ProgramWithAssignment extends Program {
  semesterAssignment: TemplateAssignment | null;
}

interface SchoolYear {
  id: string;
  name: string;
  status: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

async function fetchPrograms(schoolYearId: string): Promise<Program[]> {
  const res = await clientApi.get<Envelope<Program[]>>("/programs", {
    params: { schoolYearId },
  });
  return res.data.data ?? [];
}

function usePrograms(schoolYearId: string) {
  return useQuery({
    queryKey: ["programs", schoolYearId],
    queryFn: () => fetchPrograms(schoolYearId),
    enabled: !!schoolYearId,
  });
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  college: "College",
  shs: "Senior High School",
  jhs: "Junior High School",
  elementary: "Elementary",
};

const PROGRAM_TYPE_COLORS: Record<string, string> = {
  college: "bg-blue-500/10 text-blue-600 border-blue-200",
  shs: "bg-violet-500/10 text-violet-600 border-violet-200",
  jhs: "bg-amber-500/10 text-amber-600 border-amber-200",
  elementary: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

interface LocalTerm {
  name: string;
}

interface LocalSemester {
  name: string;
  terms: LocalTerm[];
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

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: SemesterTemplate;
}

function TemplateFormDialog({
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

        {/* MAIN CONTENT */}
        <div className="space-y-4">
          {/* Template Name */}
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder='e.g. "Standard 2-Semester"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Semesters */}
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
                  {/* Semester Header */}
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

                  {/* Terms */}
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

        {/* FOOTER */}
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

interface TemplateCardProps {
  template: SemesterTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: TemplateCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card transition-colors hover:bg-muted/30">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-90"
          )}
        />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{template.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">
            {template.semesters.length} sem
            {template.semesters.length !== 1 ? "s" : ""}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...template.semesters]
              .sort((a, b) => a.order_index - b.order_index)
              .map((sem) => (
                <div
                  key={sem.id ?? sem.order_index}
                  className="rounded-md border bg-background p-3"
                >
                  <p className="text-xs font-semibold text-foreground mb-2">
                    {sem.name}
                  </p>
                  {sem.terms.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">
                      No terms
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {[...sem.terms]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((term) => (
                          <div
                            key={term.id ?? term.order_index}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                          >
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                            {term.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AssignRowProps {
  program: ProgramWithAssignment;
  templates: SemesterTemplate[];
}

function AssignRow({
  program,
  templates,
}: AssignRowProps): React.JSX.Element {
  const assignMutation = useAssignTemplate();
  const removeMutation = useRemoveTemplateAssignment();
  const isPending = assignMutation.isPending || removeMutation.isPending;
  const compatible = templates;
  const current = program.semesterAssignment;

  const handleChange = (templateId: string | null) => {
    if (templateId === null) return;
    if (templateId === "none") {
      if (!current) return;
      removeMutation.mutate(program.id, {
        onSuccess: () => toast.success("Assignment removed."),
        onError: (e) => toast.error(errMsg(e)),
      });
    } else {
      assignMutation.mutate(
        { programId: program.id, templateId },
        {
          onSuccess: () => toast.success("Template assigned."),
          onError: (e) => toast.error(errMsg(e)),
        }
      );
    }
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      {current ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      )}
      <span className="text-sm font-medium min-w-0 flex-1 truncate">
        {program.name}
      </span>
      <div className="w-52 shrink-0">
        {compatible.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1">
            No compatible templates
          </p>
        ) : (
          <Select
            value={current?.template_id ?? "none"}
            onValueChange={handleChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Assign template…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs text-muted-foreground">
                — None —
              </SelectItem>
              {compatible.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export default function SemesterSettingsPage(): React.JSX.Element {
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();
  const [selectedYearId, setSelectedYearId] = useState<string>("");

  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy: SchoolYear) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  const { data: templates = [], isLoading: tLoading } =
    useSemesterTemplates(selectedYearId);
  const { data: programs = [], isLoading: pLoading } =
    usePrograms(selectedYearId);
  const { data: assignments = [], isLoading: aLoading } =
    useTemplateAssignments(selectedYearId);
  const deleteMutation = useDeleteSemesterTemplate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SemesterTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SemesterTemplate | null>(null);

  const programsWithAssignment = useMemo<ProgramWithAssignment[]>(() => {
    if (!Array.isArray(programs)) return [];
    return programs.map((p) => ({
      ...p,
      semesterAssignment: assignments.find((a) => a.program_id === p.id) ?? null,
    }));
  }, [programs, assignments]);

  const templatesByType = useMemo(() => {
    return new Map([["all", templates]]);
  }, [templates]);

  const programsByType = useMemo(() => {
    const map = new Map<string, ProgramWithAssignment[]>();
    for (const p of programsWithAssignment) {
      const arr = map.get(p.type) ?? [];
      arr.push(p);
      map.set(p.type, arr);
    }
    return map;
  }, [programsWithAssignment]);

  const allTypes = useMemo(
    () =>
      Array.from(
        new Set([...templatesByType.keys(), ...programsByType.keys()])
      ),
    [templatesByType, programsByType]
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Template deleted.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toast.error(errMsg(e));
        setDeleteTarget(null);
      },
    });
  };

  const isLoading = syLoading || tLoading;
  const isPanelLoading = pLoading || aLoading;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Semester Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define reusable semester templates per program type, then assign them
            to programs each school year.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {allTypes.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/25 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No templates yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Create your first semester template to define reusable semester
                and term structures for each program type.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Template
              </Button>
            </div>
          ) : (
            allTypes.map((type) => {
              const typeTemplates = templatesByType.get(type) ?? [];
              const typePrograms = programsByType.get(type) ?? [];
              const typeColor =
                PROGRAM_TYPE_COLORS[type] ??
                "bg-gray-100 text-gray-600 border-gray-200";

              return (
                <section key={type} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs border px-2 py-0.5", typeColor)}
                    >
                      {PROGRAM_TYPE_LABELS[type] ?? type}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Template
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Templates
                      </p>
                      {typeTemplates.length === 0 ? (
                        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
                          No templates for this type yet.
                        </div>
                      ) : (
                        typeTemplates.map((t) => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            onEdit={() => setEditTarget(t)}
                            onDelete={() => setDeleteTarget(t)}
                          />
                        ))
                      )}
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Assign to Programs
                      </p>
                      <Select
                        value={selectedYearId}
                        onValueChange={(v) => {
                          if (v) setSelectedYearId(v);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select school year…" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolYears.map((sy: SchoolYear) => (
                            <SelectItem
                              key={sy.id}
                              value={sy.id}
                              className="text-xs"
                            >
                              {sy.name}
                              {sy.status === "active" && (
                                <span className="ml-1.5 text-emerald-600 text-[10px]">
                                  • Active
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="rounded-lg border bg-card divide-y">
                        {isPanelLoading ? (
                          <div className="p-4 space-y-2">
                            {[1, 2].map((i) => (
                              <Skeleton key={i} className="h-8 w-full" />
                            ))}
                          </div>
                        ) : typePrograms.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                            No {PROGRAM_TYPE_LABELS[type] ?? type} programs in
                            this year.
                          </div>
                        ) : (
                          <div className="px-3">
                            {typePrograms.map((p) => (
                              <AssignRow key={p.id} program={p} templates={templates} />
                            ))}
                          </div>
                        )}
                      </div>

                      {!isPanelLoading &&
                        typePrograms.some((p) => !p.semesterAssignment) && (
                          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-700">
                              Some programs don&apos;t have a template assigned
                              yet.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}

      <TemplateFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {editTarget && (
        <TemplateFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          template={editTarget}
        />
      )}
      {deleteTarget && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete template?</DialogTitle>
              <DialogDescription>
                Delete <strong>&quot;{deleteTarget.name}&quot;</strong>? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}