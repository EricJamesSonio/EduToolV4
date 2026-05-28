"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { GradingScaleList } from "@/components/admin/grading-scale/GradingScaleList";
import { GradingScaleAssignmentSection } from "@/components/admin/grading-scale/GradingScaleAssignmentSection";
import { CreateGradingScaleDialog } from "@/components/admin/grading-scale/CreateGradingScaleDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useGradingScales, useGradingScaleAssignments } from "@/hooks/admin/useGradingScales";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { usePrograms } from "@/hooks/admin/usePrograms";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";

import type { GradingScale } from "@/types/admin/grading-scale.types";

export default function GradingScalesPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradingScale | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);

  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: scales = [], isLoading: scalesLoading } = useGradingScales();
  const { data: programs = [], isLoading: programsLoading } = usePrograms(
    selectedSchoolYearId ?? undefined
  );
  const { data: assignments = [] } = useGradingScaleAssignments(selectedSchoolYearId);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradingScaleApi.delete(id),
    onSuccess: () => {
      toast.success("Grading scale deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "gradingScales"] });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete grading scale.");
      setDeleteTarget(null);
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Grading Scales"
        description="Manage global grading scale templates and assign them to programs."
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_grading_scales" />
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Scale
            </Button>
          </div>
        }
      />

      {/* ================= GLOBAL SCALES SECTION ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Global Templates</h2>
          <Badge variant="outline">{scales.length} scales</Badge>
        </div>

        <GradingScaleList
          scales={scales}
          isLoading={scalesLoading}
          onCreateClick={() => setCreateOpen(true)}
          onEditClick={(scale) => router.push(`/admin/grading-scales/${scale.id}`)}
        />
      </div>

      {/* ================= ASSIGNMENT SECTION ================= */}
      {scales.length > 0 && (
        <>
          <div className="border-t pt-8" />
          <GradingScaleAssignmentSection
            schoolYears={schoolYears}
            programs={programs}
            scales={scales}
            assignments={assignments}
            schoolYearsLoading={schoolYearsLoading}
            programsLoading={programsLoading}
            selectedSchoolYearId={selectedSchoolYearId}
            onYearSelect={setSelectedSchoolYearId}
          />
        </>
      )}

      {/* ================= CREATE DIALOG ================= */}
      <CreateGradingScaleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* ================= DELETE CONFIRM ================= */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete grading scale?"
          message={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete Scale"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
