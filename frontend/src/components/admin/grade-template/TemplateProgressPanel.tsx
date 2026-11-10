"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import type {
  TemplateAnalysis,
  TemplateProgress,
} from "@/api/grade-template.api";

function describeColumn(g: { header: string; kind: string; termIndex?: number }) {
  if (g.kind === "term") return `${g.header} → term ${g.termIndex}`;
  if (g.kind === "final") return `${g.header} → overall`;
  return `${g.header} → remarks`;
}

export function AnalysisView({
  analysis,
}: {
  analysis: TemplateAnalysis;
}): React.ReactElement {
  if (analysis.sheets.length === 0) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        No student table was detected automatically. Check the Sheet tab, then
        use Map columns to point the system at the right columns.
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

export function ProgressPanel({
  progress,
}: {
  progress: TemplateProgress;
}): React.ReactElement {
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
                  <StatusBadge
                    status={r.status === "submitted" ? "submitted" : "pending"}
                  />
                  {r.status === "submitted" && r.submittedAt && (
                    <span className="ml-2 text-muted-foreground">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </span>
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