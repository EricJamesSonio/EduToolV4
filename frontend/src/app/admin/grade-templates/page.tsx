"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { TemplatePreview } from "@/components/admin/grade-template/TemplatePreview";
import { TemplateMapper } from "@/components/admin/grade-template/TemplateMapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import {
  gradeTemplateApi,
  readErrorMessage,
  type GradeTemplateMeta,
  type ProgramOption,
  type TemplateAnalysis,
  type TemplateProgress,
} from "@/api/grade-template.api";

const FIELD =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

type Tab = "progress" | "contents" | "map";

function describeColumn(g: { header: string; kind: string; termIndex?: number }) {
  if (g.kind === "term") return `${g.header} → term ${g.termIndex}`;
  if (g.kind === "final") return `${g.header} → overall`;
  return `${g.header} → remarks`;
}

function AnalysisView({ analysis }: { analysis: TemplateAnalysis }) {
  if (analysis.sheets.length === 0) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        No student table was detected automatically. Open the template, check
        the Contents tab, then use Map columns to point the system at the right
        columns.
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-xs">
      <p className="font-medium">
        {analysis.sheets.length} sheet(s) with a student table ·{" "}
        {analysis.totalStudentRows} student row(s)
      </p>
      {analysis.sheets.map((s) => (
        <div key={s.sheetName} className="rounded border bg-background p-2">
          <p className="font-medium">
            {s.sheetName}{" "}
            <span className="font-normal text-muted-foreground">
              · header row {s.headerRow} · {s.studentRows} students
              {!s.hasIdColumn && " · matches by name (no Student ID column)"}
              {s.subjectColumns > 0 && " · matches rows by subject"}
              {s.mapped && " · manual mapping"}
            </span>
          </p>
          {s.gradeColumns.length === 0 ? (
            <p className="text-amber-600">
              No grade columns recognised on this sheet. Nothing will be filled
              in here. Use Map columns.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Fills: {s.gradeColumns.map(describeColumn).join(", ")}
            </p>
          )}
        </div>
      ))}
      {analysis.untouchedSheets.length > 0 && (
        <p className="text-muted-foreground">
          Sheets without a student table (kept as-is in educators&apos; copies):{" "}
          {analysis.untouchedSheets.join(", ")}
        </p>
      )}
    </div>
  );
}

function ProgressPanel({ progress }: { progress: TemplateProgress }) {
  if (progress.rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No classes in this school year and department yet.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {progress.submitted} of {progress.total} classes submitted
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2">Educator</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Rows written</th>
              <th className="px-3 py-2 text-right">No grade yet</th>
              <th className="px-3 py-2 text-right">Not in template</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {progress.rows.map((r) => (
              <tr key={r.classId}>
                <td className="px-3 py-2">{r.educatorName}</td>
                <td className="px-3 py-2">
                  {r.subjectName}
                  {r.sectionName ? ` · ${r.sectionName}` : ""}
                </td>
                <td className="px-3 py-2">
                  {r.status === "submitted" ? (
                    <Badge variant="secondary">
                      Submitted{" "}
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString()
                        : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.status === "submitted" ? r.rowsWritten : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.status === "submitted" ? r.ungraded : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.status === "submitted" ? r.unmatched : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: GradeTemplateMeta;
  onDelete: (t: GradeTemplateMeta) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("progress");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<TemplateProgress | null>(null);
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null);
  const [mapVersion, setMapVersion] = useState(0);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || progress) return;
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        gradeTemplateApi.progress(template.id),
        gradeTemplateApi.analysis(template.id),
      ]);
      setProgress(p);
      setAnalysis(a);
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await gradeTemplateApi.downloadMaster(template.id, template.fileName);
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "progress", label: "Progress" },
    { id: "contents", label: "Contents" },
    { id: "map", label: "Map columns" },
  ];

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{template.name}</p>
          <p className="text-xs text-muted-foreground">
            {template.schoolYearName} ·{" "}
            {template.programName ?? "All departments"} · uploaded{" "}
            {new Date(template.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="outline">
          {template.submissionCount} class(es) submitted
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={download}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download master
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void toggle()}
        >
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Details
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={() => onDelete(template)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {open && (
        <div className="space-y-3">
          <div className="flex gap-1 border-b">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "progress" && (
            <div className="space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                </div>
              )}
              {progress && <ProgressPanel progress={progress} />}
              {analysis && <AnalysisView analysis={analysis} />}
            </div>
          )}

          {tab === "contents" && (
            <TemplatePreview templateId={template.id} refreshKey={mapVersion} />
          )}

          {tab === "map" && (
            <div className="space-y-3">
              <p className="text-xs text-amber-600">
                Change the mapping before educators send their grades. Grades
                already written stay where they are until an educator sends
                again.
              </p>
              <TemplateMapper
                templateId={template.id}
                onSaved={(a) => {
                  setAnalysis(a);
                  setMapVersion((v) => v + 1);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GradeTemplatesPage(): React.ReactElement {
  const { data: schoolYears, isLoading: yearsLoading } = useSchoolYears();
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<GradeTemplateMeta[] | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [programId, setProgramId] = useState("");
  const [name, setName] = useState("");
  const [idHeader, setIdHeader] = useState("");
  const [nameHeader, setNameHeader] = useState("");
  const [replace, setReplace] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<TemplateAnalysis | null>(
    null,
  );

  const [deleteTarget, setDeleteTarget] = useState<GradeTemplateMeta | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    try {
      setTemplates(await gradeTemplateApi.list(schoolYearId ?? undefined));
    } catch (err) {
      toast.error(await readErrorMessage(err));
      setTemplates([]);
    }
  }, [schoolYearId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setProgramId("");
    if (!schoolYearId) {
      setPrograms([]);
      return;
    }
    gradeTemplateApi
      .programs(schoolYearId)
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, [schoolYearId]);

  const handleUpload = async () => {
    if (!file || !schoolYearId) return;
    setUploading(true);
    setLastAnalysis(null);
    try {
      const res = await gradeTemplateApi.upload({
        file,
        schoolYearId,
        programId: programId || undefined,
        name,
        idHeader,
        nameHeader,
        replace,
      });
      setLastAnalysis(res.analysis);
      toast.success("Template uploaded.");
      setFile(null);
      setName("");
      setReplace(false);
      await reload();
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Grade Templates"
        actions={
          <SchoolYearSelector
            schoolYears={schoolYears ?? []}
            isLoading={yearsLoading}
            selectedId={schoolYearId}
            onSelect={setSchoolYearId}
          />
        }
      />

      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div>
          <p className="font-medium">Upload a CHED / DepEd workbook</p>
          <p className="text-xs text-muted-foreground">
            Educators receive a copy with only their own students, and their
            grades are written back into this workbook when they mark a class
            done. After uploading, open the template&apos;s Details to view its
            contents and, if needed, map its columns by hand.
          </p>
        </div>

        {!schoolYearId && (
          <p className="text-xs text-amber-600">
            Select a school year above to upload a template for it.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium">
            Department
            <select
              className={FIELD}
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              disabled={!schoolYearId}
            >
              <option value="">All departments</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            Name (optional)
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CHED Grading Sheet 1st Sem"
              maxLength={120}
            />
          </label>
          <label className="space-y-1 text-xs font-medium sm:col-span-2">
            Workbook (.xlsx, up to 10 MB)
            <input
              type="file"
              accept=".xlsx"
              className={FIELD}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Advanced: extra header names for auto-detect
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 font-medium">
              Student ID column header(s)
              <input
                className={FIELD}
                value={idHeader}
                onChange={(e) => setIdHeader(e.target.value)}
                placeholder="comma separated, e.g. Student Code"
              />
            </label>
            <label className="space-y-1 font-medium">
              Student name column header(s)
              <input
                className={FIELD}
                value={nameHeader}
                onChange={(e) => setNameHeader(e.target.value)}
                placeholder="comma separated, e.g. Learner"
              />
            </label>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />
            Replace existing template for this year and department (grades
            already collected in it are lost)
          </label>
          <Button
            className="ml-auto gap-2"
            onClick={() => void handleUpload()}
            disabled={!file || !schoolYearId || uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </Button>
        </div>

        {lastAnalysis && <AnalysisView analysis={lastAnalysis} />}
      </div>

      <div className="space-y-3">
        {templates === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
            No templates uploaded yet.
          </div>
        ) : (
          templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={setDeleteTarget} />
          ))
        )}
      </div>

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