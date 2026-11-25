"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EducatorTermFilters } from "@/components/educator/EducatorTermFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEducatorTermScope } from "@/hooks/educator/useEducatorTermScope";
import {
  gradeTemplateApi,
  readErrorMessage,
  type MyTemplate,
  type SubmitResult,
} from "@/api/grade-template.api";

export default function EducatorGradeTemplatesPage(): React.ReactElement {
  const scope = useEducatorTermScope();
  const [templates, setTemplates] = useState<MyTemplate[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<MyTemplate | null>(null);
  const [results, setResults] = useState<Record<string, SubmitResult>>({});

  const reload = useCallback(async () => {
    try {
      setTemplates(await gradeTemplateApi.mine());
    } catch (err) {
      toast.error(await readErrorMessage(err));
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Only templates (and the classes inside them) that belong to the selected
  // school year / semester.
  const visibleTemplates = useMemo(
    () =>
      (templates ?? [])
        .map((t) => ({
          template: t,
          visibleClasses: t.classes.filter((c) =>
            scope.scopedClassIds.has(c.classId),
          ),
        }))
        .filter((entry) => entry.visibleClasses.length > 0),
    [templates, scope.scopedClassIds],
  );

  const download = async (t: MyTemplate) => {
    setBusy(`download:${t.id}`);
    try {
      await gradeTemplateApi.downloadMine(
        t.id,
        `${t.name.replace(/[^\w.\- ]+/g, "_")} - my classes.xlsx`,
      );
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!confirm) return;
    const target = confirm;
    setBusy(`submit:${target.id}`);
    try {
      const res = await gradeTemplateApi.submitMine(target.id);
      setResults((prev) => ({ ...prev, [target.id]: res }));
      toast.success(
        `Sent to the admin: ${res.totalRowsWritten} grade row(s) written.`,
      );
      setConfirm(null);
      await reload();
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const loading = templates === null || scope.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade Templates"
        breadcrumbs={[
          { label: "Classes", href: "/educator/classes" },
          { label: "Grade Templates" },
        ]}
        actions={<EducatorTermFilters scope={scope} />}
      />

      <p className="text-sm text-muted-foreground">
        Your school&apos;s official grading workbook, already narrowed to your
        classes and students. Download it filled with your current grades to
        print or keep. When your grades are final, mark it done and they are
        sent to the admin&apos;s master workbook automatically.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : visibleTemplates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-16 text-sm text-muted-foreground">
          <FileSpreadsheet className="h-8 w-8 opacity-30" />
          {(templates ?? []).length === 0
            ? "No grade template has been shared for your classes yet."
            : "No grade template for the selected school year and semester."}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTemplates.map(({ template: t, visibleClasses }) => {
            const result = results[t.id];
            const allDone = t.classes.every((c) => c.submittedAt);
            return (
              <div key={t.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.schoolYearName} · {t.programName ?? "All departments"}
                    </p>
                  </div>
                  {allDone && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Sent
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => void download(t)}
                    disabled={busy !== null}
                  >
                    {busy === `download:${t.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download my copy
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setConfirm(t)}
                    disabled={busy !== null}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {allDone ? "Send again" : "Mark done & send"}
                  </Button>
                </div>

                <ul className="space-y-1 text-xs">
                  {visibleClasses.map((c) => (
                    <li key={c.classId} className="flex items-center gap-2">
                      <span className="font-medium">
                        {c.subjectName}
                        {c.sectionName ? ` · ${c.sectionName}` : ""}
                      </span>
                      {c.submittedAt ? (
                        <span className="text-muted-foreground">
                          sent {new Date(c.submittedAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-amber-600">not sent yet</span>
                      )}
                    </li>
                  ))}
                </ul>

                {result && (
                  <div className="space-y-1 rounded-lg border bg-muted/20 p-3 text-xs">
                    {result.classes.map((c) => (
                      <p key={c.classId}>
                        <span className="font-medium">{c.subjectName}:</span>{" "}
                        {c.rowsWritten} written
                        {c.ungraded > 0 &&
                          ` · ${c.ungraded} student(s) have no grade yet`}
                        {c.unmatched > 0 &&
                          ` · ${c.unmatched} enrolled student(s) were not found in the template`}
                      </p>
                    ))}
                    {result.ambiguousRows > 0 && (
                      <p className="text-amber-600">
                        {result.ambiguousRows} row(s) matched more than one of
                        your classes; the first was used.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title="Send grades to the admin"
        message={
          <span>
            This writes your current computed grades for this template into the
            admin&apos;s master workbook. You can send again later if grades
            change. Make sure you have computed grades for every term first.
          </span>
        }
        confirmLabel={busy?.startsWith("submit:") ? "Sending..." : "Send"}
        onConfirm={submit}
        isLoading={busy?.startsWith("submit:") ?? false}
      />
    </div>
  );
}