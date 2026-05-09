// src/app/admin/grading-schemes/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";

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

function usePrograms(schoolYearId: string) {
  return useQuery({
    queryKey: ["programs", schoolYearId],
    queryFn: () => fetchPrograms(schoolYearId),
    enabled: !!schoolYearId,
  });
}

export default function GradingSchemesPage(): React.JSX.Element {
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<GradingSchemeTemplate | null>(null);

  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedYearId]);

  const { data: templates = [], isLoading: tLoading } =
    useGradingSchemeTemplates();

  const { data: programs = [], isLoading: pLoading } =
    usePrograms(selectedYearId);

  // ✅ FIXED: use classApi instead of raw fetch
  const { data: classes = [] } = useQuery({
    queryKey: ["admin", "classes", selectedYearId],
    queryFn: () => classApi.getAll({ schoolYearId: selectedYearId }),
    enabled: !!selectedYearId,
  });

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
    <div className="space-y-8 pb-10">
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
          <div className="lg:col-span-2 space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-3 space-y-3">
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

          {/* Assignment Panel */}
          <div className="lg:col-span-2 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                School Year
              </p>
              <Select
                value={selectedYearId}
                onValueChange={(v) => setSelectedYearId(v ?? "")}
              >
                <SelectTrigger className="h-8 text-xs">
                  <span className="truncate text-xs">
                    {schoolYears.find((sy) => sy.id === selectedYearId)?.name ?? "Select school year…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.id} className="text-xs">
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

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Apply Templates
              </p>
              <TemplateAssignmentPanel
                programs={programsWithClasses}
                templates={templates}
                isLoading={pLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <TemplateFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit Dialog */}
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