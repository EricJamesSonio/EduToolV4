// ===== File: frontend/src/app/admin/grading-schemes/page.tsx =====
"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";

import { GradingSchemeTemplateList } from "@/components/admin/grading-scheme-template/GradingSchemeTemplateList";
import { TemplateAssignmentPanel } from "@/components/admin/grading-scheme-template/TemplateAssignmentPanel";
import { TemplateFormDialog } from "@/components/admin/grading-scheme-template/TemplateFormDialog";

import { useGradingSchemeTemplates } from "@/hooks/admin/useGradingSchemeTemplates";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";

import clientApi from "@/api/client";
import { classApi } from "@/api/admin/class.api";

import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";

interface Program {
  id: string;
  name: string;
  type: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

async function fetchPrograms(
  schoolYearId: string
): Promise<Program[]> {
  const res = await clientApi.get<Envelope<Program[]>>(
    "/programs",
    {
      params: { schoolYearId },
    }
  );

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
  // ================= STATE =================
  const { data: schoolYears = [], isLoading: syLoading } =
    useSchoolYears();

  const [selectedYearId, setSelectedYearId] =
    useState<string>("");

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editTarget, setEditTarget] =
    useState<GradingSchemeTemplate | null>(null);

  // ================= AUTO SELECT =================
  useEffect(() => {
    if (!selectedYearId && schoolYears.length > 0) {
      const active = schoolYears.find(
        (sy) => sy.status === "active"
      );

      setSelectedYearId(
        active?.id ?? schoolYears[0].id
      );
    }
  }, [schoolYears, selectedYearId]);

  // ================= QUERIES =================
  const {
    data: templates = [],
    isLoading: tLoading,
  } = useGradingSchemeTemplates();

  const {
    data: programs = [],
    isLoading: pLoading,
  } = usePrograms(selectedYearId);

  const { data: classes = [] } = useQuery({
    queryKey: [
      "admin",
      "classes",
      selectedYearId,
    ],
    queryFn: () =>
      classApi.getAll({
        schoolYearId: selectedYearId,
      }),
    enabled: !!selectedYearId,
  });

  // ================= DATA TRANSFORMATION =================
  const programsWithClasses = useMemo(() => {
    return programs.map((prog) => ({
      ...prog,

      classes: classes
        .filter(
          (cls) => cls.programId === prog.id
        )
        .map((cls) => ({
          id: cls.id,
          name:
            cls.title ??
            cls.subjectName ??
            cls.subjectId,
          programId: cls.programId,
        })),
    }));
  }, [programs, classes]);

  const isLoading =
    syLoading ||
    tLoading ||
    pLoading;

  return (
    <div className="space-y-8 pb-10">
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Grading Scheme Templates"
        description="Create reusable grading scheme templates and assign them to programs or individual classes."
        actions={
          <Button
            size="sm"
            onClick={() =>
              setCreateOpen(true)
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
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
          {/* ================= TEMPLATE SECTION ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                Global Templates
              </h2>

              <Badge variant="outline">
                {templates.length} templates
              </Badge>
            </div>

            <GradingSchemeTemplateList
              templates={templates}
              isLoading={tLoading}
              onCreateClick={() =>
                setCreateOpen(true)
              }
              onEditClick={(template) =>
                setEditTarget(template)
              }
            />
          </div>

          {/* ================= ASSIGNMENT SECTION ================= */}
          {templates.length > 0 && (
            <>
              <div className="border-t pt-8" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Template Assignment
                    </h2>

                    <Badge variant="outline">
                      {programs.length} programs
                    </Badge>
                  </div>

                  <SchoolYearSelector
                    schoolYears={schoolYears}
                    isLoading={syLoading}
                    selectedId={selectedYearId}
                    onSelect={setSelectedYearId}
                  />
                </div>

                <TemplateAssignmentPanel
                  programs={programsWithClasses}
                  templates={templates}
                  isLoading={pLoading}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* ================= DIALOGS ================= */}
      <TemplateFormDialog
        open={createOpen}
        onClose={() =>
          setCreateOpen(false)
        }
      />

      {editTarget && (
        <TemplateFormDialog
          open={!!editTarget}
          onClose={() =>
            setEditTarget(null)
          }
          template={editTarget}
        />
      )}
    </div>
  );
}