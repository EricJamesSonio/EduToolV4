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

import type {
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";
import {
  useSemesterTemplates,
  useDeleteSemesterTemplate,
  useTemplateAssignments,
} from "@/hooks/admin/useSemesterTemplate";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { useQuery } from "@tanstack/react-query";
import clientApi from "@/api/client";
import { TemplateFormDialog } from "@/components/admin/semester-settings/TemplateFormDialog";
import { TemplateCard } from "@/components/admin/semester-settings/TemplateCard";
import { AssignRow } from "@/components/admin/semester-settings/AssignRow";
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_COLORS,
} from "@/components/admin/semester-settings/constants";

// -------------------- Types --------------------
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

// -------------------- Fetchers --------------------
async function fetchPrograms(schoolYearId: string): Promise<Program[]> {
  const res = await clientApi.get<Envelope<Program[]>>("/programs", {
    params: { schoolYearId },
  });
  return res.data.data ?? [];
}

function useProgramsBySchoolYear(schoolYearId?: string) {
  return useQuery({
    queryKey: ["programs", schoolYearId],
    queryFn: () => fetchPrograms(schoolYearId!),
    enabled: !!schoolYearId,
  });
}

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong.";

// -------------------- Component --------------------
export default function SemesterSettingsPage(): React.JSX.Element {
  // ── School Years
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy: SchoolYear) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  // ── Templates (always load, not school-year dependent)
  const { data: templates = [], isLoading: tLoading } = useSemesterTemplates();

  // ── Programs & Assignments (school-year dependent)
  const { data: programs = [], isLoading: pLoading } =
    useProgramsBySchoolYear(selectedYearId ?? undefined);
  const { data: assignments = [], isLoading: aLoading } =
    useTemplateAssignments(selectedYearId ?? undefined);

  const deleteMutation = useDeleteSemesterTemplate();

  // ── Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [createFromType, setCreateFromType] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SemesterTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SemesterTemplate | null>(null);

  // ── Memoized groupings
  const programsWithAssignment = useMemo<ProgramWithAssignment[]>(() =>
    programs.map((p) => ({
      ...p,
      semesterAssignment: assignments.find((a) => a.program_id === p.id) ?? null,
    })),
    [programs, assignments]
  );

  const templatesByType = useMemo(() => {
    const map = new Map<string, SemesterTemplate[]>();
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

  // ── Types for each section
  const templateTypes = useMemo(
    () => Array.from(templatesByType.keys()),
    [templatesByType]
  );

  const programTypes = useMemo(
    () => Array.from(programsByType.keys()),
    [programsByType]
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

  const isPanelLoading = pLoading || aLoading;

  return (
    <div className="space-y-10 pb-10">
      {/* ════════════════════════════════════════════════════════════ */}
      {/* ══ SECTION 1: Global Template Library ══ */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Semester Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define reusable semester templates per program type, then assign
              them to programs.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Templates by type */}
        {tLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : templateTypes.length === 0 ? (
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
          <div className="space-y-6">
            {templateTypes.map((type) => {
              const typeTemplates = templatesByType.get(type) ?? [];
              const typeColor =
                PROGRAM_TYPE_COLORS[type] ??
                "bg-gray-100 text-gray-600 border-gray-200";

              return (
                <section key={type} className="space-y-3">
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
                  <div className="space-y-2">
                    {typeTemplates.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        onEdit={() => setEditTarget(t)}
                        onDelete={() => setDeleteTarget(t)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t" />

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ══ SECTION 2: Assign to Programs (school-year scoped) ══ */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Assign to Programs
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a school year to assign semester templates to its programs.
            </p>
          </div>

          {/* School Year Selector */}
          <Select
            value={selectedYearId ?? ""}
            onValueChange={(v) => {
              if (v) setSelectedYearId(v);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select school year…" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((sy: SchoolYear) => (
                <SelectItem key={sy.id} value={sy.id}>
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
        </div>

        {/* Programs by type */}
        {!selectedYearId ? (
          <p className="text-sm text-muted-foreground">
            Select a school year to view programs.
          </p>
        ) : isPanelLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : programTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No programs found for this school year.
          </p>
        ) : (
          <div className="space-y-6">
            {programTypes.map((type) => {
              const typePrograms = programsByType.get(type) ?? [];
              const compatibleTemplates = templatesByType.get(type) ?? [];
              const typeColor =
                PROGRAM_TYPE_COLORS[type] ??
                "bg-gray-100 text-gray-600 border-gray-200";

              return (
                <section key={type} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs border px-2 py-0.5", typeColor)}
                    >
                      {PROGRAM_TYPE_LABELS[type] ?? type}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="rounded-lg border bg-card divide-y">
                    <div className="px-3">
                      {typePrograms.map((p) => (
                        <AssignRow
                          key={p.id}
                          program={p}
                          templates={compatibleTemplates}
                        />
                      ))}
                    </div>
                  </div>
                  {typePrograms.some((p) => !p.semesterAssignment) && (
                    <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-700">
                        Some programs don&apos;t have a template assigned yet.
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ══ Dialogs ══ */}
      {/* ════════════════════════════════════════════════════════════ */}
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