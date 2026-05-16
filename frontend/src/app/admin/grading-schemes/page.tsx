// ===== File: frontend/src/app/admin/grading-schemes/page.tsx =====
"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";

import { GradingSchemeTemplateList } from "@/components/admin/grading-scheme-template/GradingSchemeTemplateList";
import { TemplateAssignmentPanel } from "@/components/admin/grading-scheme-template/TemplateAssignmentPanel";
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
import { useQuery } from "@tanstack/react-query";
import clientApi from "@/api/client";
import { classApi } from "@/api/admin/class.api";

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

function usePrograms(schoolYearId: any) {
  const fixedId =
    typeof schoolYearId === "string"
      ? schoolYearId
      : schoolYearId?.schoolYearId;

  return useQuery({
    queryKey: ["programs", fixedId],
    queryFn: () => fetchPrograms(fixedId),
    enabled: !!fixedId,
  });
}

export default function GradingSchemesPage(): React.JSX.Element {
  // ================= STATE (SAME AS ORIGINAL) =================
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<GradingSchemeTemplate | null>(null);

  // ================= AUTO-SELECT (SAME AS ORIGINAL) =================
  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  // ================= QUERIES (SAME AS ORIGINAL) =================
  const { data: templates = [], isLoading: tLoading } =
    useGradingSchemeTemplates();

  const { data: programs = [], isLoading: pLoading } =
    usePrograms(selectedYearId);

  const { data: classes = [] } = useQuery({
    queryKey: ["admin", "classes", selectedYearId],
    queryFn: () => classApi.getAll({ schoolYearId: selectedYearId }),
    enabled: !!selectedYearId,
  });

  // ================= DATA TRANSFORMATION (SAME AS ORIGINAL) =================
  const programsWithClasses = useMemo(() => {
    return programs.map((prog) => ({
      ...prog,
      classes: classes
        .filter((cls) => cls.programId === prog.id)
        .map((cls) => ({
          id: cls.id,
          name: cls.title ?? cls.subjectName ?? cls.subjectId,
          programId: cls.programId,
        })),
    }));
  }, [programs, classes]);

  const isLoading = syLoading || tLoading || pLoading;

  return (
    <div className="space-y-8 p-6">
      {/* ================= HEADER (SAME) ================= */}
      <PageHeader
        title="Grading Scheme Templates"
        description="Create reusable grading scheme templates and apply them to programs or individual classes."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Template
          </Button>
        }
      />

      {isLoading ? (
        // ================= LOADING (SAME STRUCTURE) =================
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        // ================= MAIN CONTENT (NEW LAYOUT STRUCTURE) =================
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

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Templates
            </p>

            <GradingSchemeTemplateList
              templates={templates}
              isLoading={tLoading}
              onCreateClick={() => setCreateOpen(true)}
              onEditClick={(template) => setEditTarget(template)}
            />
          </div>

          {/* ================= APPLICATION SECTION ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Apply Templates</h2>
              <SchoolYearSelector
                schoolYears={schoolYears}
                isLoading={syLoading}
                selectedId={selectedYearId}
                onSelect={setSelectedYearId}
              />
            </div>

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Apply Templates
            </p>

            {/* ✅ USES EXACT SAME COMPONENT AS ORIGINAL - LOGIC UNCHANGED */}
            <TemplateAssignmentPanel
              programs={programsWithClasses}
              templates={templates}
              isLoading={pLoading}
            />
          </div>
        </>
      )}

      {/* ================= DIALOGS (SAME AS ORIGINAL) ================= */}
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