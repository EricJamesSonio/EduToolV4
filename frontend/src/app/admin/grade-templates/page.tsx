"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { AddTemplateDialog } from "@/components/admin/grade-template/AddTemplateDialog";
import { TemplateTable } from "@/components/admin/grade-template/TemplateTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import {
  gradeTemplateApi,
  readErrorMessage,
  type GradeTemplateMeta,
} from "@/api/grade-template.api";

export default function GradeTemplatesPage(): React.ReactElement {
  const router = useRouter();
  const { data: schoolYears, isLoading: yearsLoading } = useSchoolYears();
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<GradeTemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradeTemplateMeta | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const schoolYearName =
    schoolYears?.find((sy) => sy.id === schoolYearId)?.name ?? "";

  const reload = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setTemplates(await gradeTemplateApi.list(schoolYearId ?? undefined));
    } catch (err) {
      setFailed(true);
      toast.error(await readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [schoolYearId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const view = useCallback(
    (t: GradeTemplateMeta) => router.push(`/admin/grade-templates/${t.id}`),
    [router],
  );

  const download = useCallback(async (t: GradeTemplateMeta) => {
    try {
      await gradeTemplateApi.downloadMaster(t.id, t.fileName);
    } catch (err) {
      toast.error(await readErrorMessage(err));
    }
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await gradeTemplateApi.remove(deleteTarget.id);
      toast.success("Template deleted.");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Templates"
        description="CHED / DepEd workbooks that educators fill in and send back."
        actions={
          <SchoolYearSelector
            schoolYears={schoolYears ?? []}
            isLoading={yearsLoading}
            selectedId={schoolYearId}
            onSelect={setSchoolYearId}
          />
        }
      />

      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          disabled={!schoolYearId}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <AsyncListState
        isLoading={loading}
        isError={failed}
        isEmpty={templates.length === 0}
        empty={{
          icon: FileSpreadsheet,
          title: "No templates yet",
          description: schoolYearId
            ? "Add your CHED or DepEd workbook for this school year."
            : "Select a school year first.",
          action: schoolYearId
            ? { label: "Add Template", onClick: () => setAddOpen(true) }
            : undefined,
        }}
        loading={
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <TemplateTable
          data={templates}
          onView={view}
          onDownload={(t) => void download(t)}
          onDelete={setDeleteTarget}
        />
      </AsyncListState>

      {addOpen && schoolYearId && (
        <AddTemplateDialog
          open
          onClose={() => setAddOpen(false)}
          schoolYearId={schoolYearId}
          schoolYearName={schoolYearName}
          onUploaded={(res) => {
            setAddOpen(false);
            toast.success("Template added.");
            if (res.analysis.sheets.length === 0) {
              toast.warning(
                "No student table was detected. Open Map columns to set it up.",
              );
            }
            router.push(`/admin/grade-templates/${res.id}`);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete template"
        destructive
        message={
          <span>
            Delete &quot;{deleteTarget?.name}&quot; and all grades collected in
            it? Download the master first if you still need it.
          </span>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </div>
  );
}