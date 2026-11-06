"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { TemplatePreview } from "@/components/admin/grade-template/TemplatePreview";
import { TemplateMapper } from "@/components/admin/grade-template/TemplateMapper";
import {
  AnalysisView,
  ProgressPanel,
} from "@/components/admin/grade-template/TemplateProgressPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  gradeTemplateApi,
  readErrorMessage,
  type GradeTemplateMeta,
  type TemplateAnalysis,
  type TemplateProgress,
} from "@/api/grade-template.api";

type Tab = "sheet" | "map" | "progress";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "sheet", label: "Sheet" },
  { id: "map", label: "Map columns" },
  { id: "progress", label: "Progress" },
];

export default function GradeTemplateDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [template, setTemplate] = useState<GradeTemplateMeta | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null);
  const [progress, setProgress] = useState<TemplateProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("sheet");
  const [mapVersion, setMapVersion] = useState(0);
  const autoSwitched = useRef(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, a] = await Promise.all([
          gradeTemplateApi.list(),
          gradeTemplateApi.analysis(id),
        ]);
        if (cancelled) return;
        const found = all.find((t) => t.id === id) ?? null;
        setTemplate(found);
        setMissing(!found);
        setAnalysis(a);
        if (a.sheets.length === 0 && !autoSwitched.current) {
          autoSwitched.current = true;
          setTab("map");
        }
      } catch (err) {
        if (cancelled) return;
        setMissing(true);
        toast.error(await readErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loadProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      setProgress(await gradeTemplateApi.progress(id));
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setProgressLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (tab === "progress" && !progress) void loadProgress();
  }, [tab, progress, loadProgress]);

  const download = async () => {
    if (!template) return;
    setDownloading(true);
    try {
      await gradeTemplateApi.downloadMaster(template.id, template.fileName);
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    setDeleting(true);
    try {
      await gradeTemplateApi.remove(template.id);
      toast.success("Template deleted.");
      router.push("/admin/grade-templates");
    } catch (err) {
      toast.error(await readErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading template...
      </div>
    );
  }

  if (missing || !template) {
    return (
      <EmptyState
        title="Template not found"
        description="It may have been deleted."
        action={{
          label: "Back to templates",
          onClick: () => router.push("/admin/grade-templates"),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={`${template.schoolYearName} · ${
          template.programName ?? "All departments"
        } · uploaded ${new Date(template.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: "Grade Templates", href: "/admin/grade-templates" },
          { label: template.name },
        ]}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void download()}
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
              className="gap-1.5 text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        }
      />

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sheet" && (
        <TemplatePreview templateId={template.id} refreshKey={mapVersion} />
      )}

      {tab === "map" && (
        <div className="space-y-3">
          <p className="text-xs text-amber-600">
            Change the mapping before educators send their grades. Grades
            already written stay where they are until an educator sends again.
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

      {tab === "progress" && (
        <div className="space-y-4">
          {progressLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
            </div>
          )}
          {progress && <ProgressPanel progress={progress} />}
          {analysis && <AnalysisView analysis={analysis} />}
        </div>
      )}
    </div>
  );
}