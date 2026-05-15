// ===== File: frontend/src/app/admin/grading-schemes/page.tsx =====
"use client";

import { useState, useMemo } from "react";
import { Plus, Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { DataTable } from "@/components/shared/DataTable";

import { GradingSchemeTemplateList } from "@/components/admin/grading-scheme-template/GradingSchemeTemplateList";
import { TemplateFormDialog } from "@/components/admin/grading-scheme-template/TemplateFormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGradingSchemeTemplates } from "@/hooks/admin/useGradingSchemeTemplates";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientApi from "@/api/client";
import { classApi } from "@/api/admin/class.api";
import { toast } from "sonner";

import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { Class } from "@/types/admin/class.types";

interface Program {
  id: string;
  name: string;
  type: string;
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

function usePrograms(schoolYearId: string | null) {
  return useQuery({
    queryKey: ["programs", schoolYearId],
    queryFn: () => fetchPrograms(schoolYearId!),
    enabled: !!schoolYearId,
  });
}

interface ApplyTemplatePayload {
  classId: string;
  templateId: string;
}

// API call to apply template to class
async function applyTemplateToClass(
  payload: ApplyTemplatePayload
): Promise<void> {
  await clientApi.post(`/grading-schemes/apply-template`, payload);
}

export default function GradingSchemesPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  // ================= STATE =================
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GradingSchemeTemplate | null>(
    null
  );
  const [applyTarget, setApplyTarget] = useState<{
    classId: string;
    className: string;
  } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // ================= QUERIES =================
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();
  const { data: templates = [], isLoading: tLoading } =
    useGradingSchemeTemplates();

  const { data: programsRaw = [], isLoading: pLoading } = usePrograms(
    selectedSchoolYearId
  );

  // ✅ FIXED: Fetch classes with school year filter
  const { data: classesRaw = [] } = useQuery({
    queryKey: ["admin", "classes", selectedSchoolYearId],
    queryFn: () =>
      classApi.getAll({ schoolYearId: selectedSchoolYearId! }),
    enabled: !!selectedSchoolYearId,
  });

  // ================= MUTATIONS =================
  const applyMutation = useMutation({
    mutationFn: (payload: ApplyTemplatePayload) =>
      applyTemplateToClass(payload),
    onSuccess: () => {
      toast.success("Template applied to class successfully.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "classes", selectedSchoolYearId],
      });
      setApplyTarget(null);
      setSelectedTemplateId("");
    },
    onError: () => {
      toast.error("Failed to apply template to class.");
    },
  });

  // ================= DATA TRANSFORMATION =================
  // Safely convert to arrays
  const programs = useMemo(
    () => (Array.isArray(programsRaw) ? programsRaw : []),
    [programsRaw]
  );

  const classes = useMemo(
    () => (Array.isArray(classesRaw) ? classesRaw : []),
    [classesRaw]
  );

  // ✅ Build program->class mapping with debugging
  const programsWithClasses = useMemo(() => {
    return programs.map((prog) => {
      // Get all classes for this program
      // Match by: direct program_id OR subject.program_id
      const classesForProgram = classes.filter((cls: any) => {
        const clsProgramId =
          cls.programId || // Direct match
          cls.program_id || // Snake case
          cls.subject?.program_id || // Via subject
          (cls.subject?.course && cls.subject.course.program_id) || // Via course
          (cls.subject?.strand && cls.subject.strand.program_id); // Via strand

        return clsProgramId === prog.id;
      });

      return {
        ...prog,
        classes: classesForProgram.map((cls: any) => ({
          id: cls.id,
          name: cls.title ?? cls.subjectName ?? cls.subjectId,
          programId: prog.id,
          className: cls.title ?? cls.subjectName ?? cls.subjectId,
        })),
      };
    });
  }, [programs, classes]);

  // Flatten classes for the table with program info
  const allClassesForTable = useMemo(() => {
    return programsWithClasses.flatMap((prog) =>
      prog.classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        className: cls.name,
        programName: prog.name,
        programId: prog.id,
      }))
    );
  }, [programsWithClasses]);

  const isLoading = syLoading || tLoading || pLoading;

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  // ================= HANDLERS =================
  const handleApplyTemplate = (classId: string, className: string) => {
    setApplyTarget({ classId, className });
    setSelectedTemplateId(templates[0]?.id ?? "");
  };

  const handleConfirmApply = () => {
    if (!applyTarget || !selectedTemplateId) return;

    applyMutation.mutate({
      classId: applyTarget.classId,
      templateId: selectedTemplateId,
    });
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Class",
        size: 300,
      },
      {
        accessorKey: "programName",
        header: "Program",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleApplyTemplate(row.original.id, row.original.name)
              }
              disabled={templates.length === 0}
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Apply Template
            </Button>
          </div>
        ),
      },
    ],
    [templates]
  );

  return (
    <div className="space-y-8 p-6">
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Grading Scheme Templates"
        description="Create reusable grading scheme templates and apply them to classes."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {/* ================= TEMPLATES SECTION ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Available Templates</h2>
              <span className="text-xs text-muted-foreground">
                ({templates.length})
              </span>
            </div>

            {templates.length > 0 ? (
              <div className="rounded-lg border bg-background p-4 space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{template.name}</p>
                      {template.program_type && (
                        <p className="text-xs text-muted-foreground">
                          Type: {template.program_type}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.components?.length ?? 0} components
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditTarget(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No templates created yet.{" "}
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Create one now
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* ================= APPLICATION SECTION ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Apply to Classes</h2>
              </div>
              <SchoolYearSelector
                schoolYears={schoolYears}
                isLoading={syLoading}
                selectedId={selectedSchoolYearId}
                onSelect={setSelectedSchoolYearId}
              />
            </div>

            {selectedSchoolYearId ? (
              <>
                {allClassesForTable.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <DataTable
                      columns={columns}
                      data={allClassesForTable}
                      isLoading={pLoading}
                      emptyTitle="No classes found"
                      emptyDescription="No classes exist for this school year. Create classes first before applying templates."
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No classes found for this school year. Create classes first.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a school year to see and apply templates to classes.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= APPLY TEMPLATE MODAL ================= */}
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-background p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Apply Template to Class
            </h2>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Class
              </p>
              <p className="text-base font-medium text-foreground">
                {applyTarget.className}
              </p>
            </div>

            {/* Template selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Template</label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        {t.program_type && (
                          <span className="text-xs text-muted-foreground">
                            ({t.program_type})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template details */}
            {selectedTemplate && (
              <div className="rounded-md bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Template Details
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Components:</span>{" "}
                    <span className="text-muted-foreground">
                      {selectedTemplate.components?.length ?? 0}
                    </span>
                  </p>
                  {selectedTemplate.program_type && (
                    <p className="text-sm">
                      <span className="font-medium">Program Type:</span>{" "}
                      <span className="text-muted-foreground">
                        {selectedTemplate.program_type}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Applying this template may override the class's existing grading
              scheme configuration.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setApplyTarget(null);
                  setSelectedTemplateId("");
                }}
                disabled={applyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={applyMutation.isPending || !selectedTemplateId}
                onClick={handleConfirmApply}
              >
                {applyMutation.isPending ? "Applying..." : "Apply Template"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIALOGS ================= */}
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
    </div>
  );
}