"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { Plus, Layers, AlertCircle } from "lucide-react";
import type { AxiosError } from "axios";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import type {
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";
import {
  useSemesterTemplates,
  useDeleteSemesterTemplate,
  useTemplateAssignments,
} from "@/hooks/admin/useSemesterTemplate";
import { useQuery } from "@tanstack/react-query";
import clientApi from "@/api/client";
import { TemplateFormDialog } from "@/components/admin/semester-settings/TemplateFormDialog";
import { TemplateCard } from "@/components/admin/semester-settings/TemplateCard";
import { AssignRow } from "@/components/admin/semester-settings/AssignRow";
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_COLORS,
} from "@/components/admin/semester-settings/constants";

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

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong.";

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
    useSemesterTemplates(); // Don't pass schoolYearId - get all templates
  const { data: programs = [], isLoading: pLoading } =
    usePrograms(selectedYearId);
  const { data: assignments = [], isLoading: aLoading } =
    useTemplateAssignments(selectedYearId);
  const deleteMutation = useDeleteSemesterTemplate();

  const [createOpen, setCreateOpen] = useState(false);
  const [createFromType, setCreateFromType] = useState<string | null>(null);
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
    const map = new Map<string, typeof templates>();
    for (const t of templates) {
      const arr = map.get(t.program_type) ?? [];
      arr.push(t);
      map.set(t.program_type, arr);
    }
    return map;
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
      {/* Header */}
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

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Empty State */}
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
                  {/* Type Badge & Header */}
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
                      onClick={() => {
                        setCreateFromType(type);
                        setCreateOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Template
                    </Button>
                  </div>

                  {/* Templates & Assignment Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Templates Column */}
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

                    {/* Assignment Column */}
                    <div className="lg:col-span-2 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Assign to Programs
                      </p>

                      {/* School Year Select */}
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

                      {/* Programs Assignment */}
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
                              <AssignRow
                                key={p.id}
                                program={p}
                                templates={templates.filter((t) => t.program_type === type)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Unassigned Warning */}
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

      {/* Dialogs */}
      <TemplateFormDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFromType(null);
        }}
        programType={
          createFromType
            ? (createFromType as "college" | "shs" | "jhs" | "elementary")
            : undefined
        }
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