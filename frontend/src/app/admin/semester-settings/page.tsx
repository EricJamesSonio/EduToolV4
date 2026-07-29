// ===== File: frontend/src/app/admin/semester-settings/page.tsx =====
"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { AxiosError } from "axios";
import type { ProgramType } from "@/types/admin/semester-template.types";
import type { SemesterTemplate, TemplateAssignment } from "@/types/admin/semester-template.types";
import {
  useSemesterTemplates,
  useDeleteSemesterTemplate,
  useTemplateAssignments,
} from "@/hooks/admin/useSemesterTemplate";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import clientApi from "@/api/client";
import { TemplateFormDialog } from "@/components/admin/semester-settings/TemplateFormDialog";
import { TemplateLibrary } from "@/components/admin/semester-settings/TemplateLibrary";
import { AssignmentSection } from "@/components/admin/semester-settings/AssignmentSection";
import type { SchoolYear } from "@/types/admin/school-year.types";

interface Program {
  id: string;
  name: string;
  type: string;
  school_year_id: string;
}

interface ProgramWithAssignment extends Program {
  semesterAssignment: TemplateAssignment | null;
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

export default function SemesterSettingsPage(): React.JSX.Element {
  // ================= STATE =================
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createFromType, setCreateFromType] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SemesterTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SemesterTemplate | null>(
    null
  );

  // ================= QUERIES =================
  const { data: templates = [], isLoading: tLoading } = useSemesterTemplates();
  const { data: programs = [], isLoading: pLoading } = useProgramsBySchoolYear(
    selectedYearId ?? undefined
  );
  const { data: assignments = [], isLoading: aLoading } =
    useTemplateAssignments(selectedYearId);

  const deleteMutation = useDeleteSemesterTemplate();

  // ================= DATA TRANSFORMATION =================
  const programsWithAssignment = useMemo<ProgramWithAssignment[]>(
    () =>
      programs.map((p) => ({
        ...p,
        semesterAssignment:
          assignments.find((a) => a.program_id === p.id) ?? null,
      })),
    [programs, assignments]
  );

  // ================= HANDLERS =================
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
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Semester Settings"
        description="Define reusable semester templates per program type, then assign them to programs."
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_semester_settings" />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Template
            </Button>
          </div>
        }
      />

      {/* ================= SECTION 1: Template Library ================= */}
      <div className="space-y-4">
        <TemplateLibrary
          templates={templates}
          isLoading={tLoading}
          onCreateClick={() => setCreateOpen(true)}
          onCreateFromType={(type) => {
            setCreateFromType(type);
            setCreateOpen(true);
          }}
          onEdit={(template) => setEditTarget(template)}
          onDelete={(template) => setDeleteTarget(template)}
        />
      </div>

      <div className="border-t" />

      {/* ================= SECTION 2: Assignment Panel ================= */}
      <AssignmentSection
        schoolYears={schoolYears as SchoolYear[]}
        programs={programsWithAssignment}
        templates={templates}
        selectedYearId={selectedYearId}
        onYearSelect={setSelectedYearId}
        isSchoolYearsLoading={syLoading}
        isProgramsLoading={isPanelLoading}
      />

      {/* ================= DIALOGS ================= */}
      <TemplateFormDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateFromType(null);
        }}
        programType={(createFromType as ProgramType) ?? undefined}
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
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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