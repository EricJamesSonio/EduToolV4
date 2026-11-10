"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TemplateViewer } from "@/components/admin/grade-template/TemplateViewer";
import { cn } from "@/lib/utils";
import {
  colLetter,
  gradeTemplateApi,
  readErrorMessage,
  type SheetMapping,
  type TemplatePreviewData,
} from "@/api/grade-template.api";

const LIMIT = 60;

type Mode = "file" | "roles";

function roleOf(
  col: number,
  m: SheetMapping | null,
): { label: string; cls: string } | null {
  if (!m) return null;
  if (m.idCol === col) {
    return { label: "Student ID", cls: "bg-sky-100 dark:bg-sky-950/50" };
  }
  if (m.nameCols.includes(col)) {
    return { label: "Name", cls: "bg-indigo-100 dark:bg-indigo-950/50" };
  }
  if (m.subjectCols.includes(col)) {
    return { label: "Subject", cls: "bg-violet-100 dark:bg-violet-950/50" };
  }
  const term = m.termCols.find((t) => t.col === col);
  if (term) {
    return {
      label: `Term ${term.termIndex}`,
      cls: "bg-amber-100 dark:bg-amber-950/50",
    };
  }
  if (m.finalCol === col) {
    return { label: "Overall", cls: "bg-emerald-100 dark:bg-emerald-950/50" };
  }
  if (m.remarkCol === col) {
    return { label: "Remarks", cls: "bg-rose-100 dark:bg-rose-950/50" };
  }
  return null;
}

function RolesGrid({
  templateId,
  refreshKey,
}: {
  templateId: string;
  refreshKey: number;
}): React.ReactElement {
  const [data, setData] = useState<TemplatePreviewData | null>(null);
  const [sheet, setSheet] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await gradeTemplateApi.preview(templateId, {
          sheet,
          offset,
          limit: LIMIT,
        }),
      );
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [templateId, sheet, offset]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const mapping = data?.mapping ?? null;
  const cols = data
    ? Array.from({ length: data.colCount }, (_, i) => i + 1)
    : [];
  const first = data && data.rows.length > 0 ? data.rows[0].row : 0;
  const last = data && data.rows.length > 0 ? data.rows[data.rows.length - 1].row : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {data?.sheets.map((s) => (
          <button
            key={s.name}
            onClick={() => {
              setSheet(s.name);
              setOffset(0);
            }}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
              data.sheetName === s.name
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
            {s.mapped ? " · mapped" : s.detected ? "" : " · no table found"}
          </button>
        ))}
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        {[
          ["Student ID", "bg-sky-100 dark:bg-sky-950/50"],
          ["Name", "bg-indigo-100 dark:bg-indigo-950/50"],
          ["Subject", "bg-violet-100 dark:bg-violet-950/50"],
          ["Term columns", "bg-amber-100 dark:bg-amber-950/50"],
          ["Overall", "bg-emerald-100 dark:bg-emerald-950/50"],
          ["Remarks", "bg-rose-100 dark:bg-rose-950/50"],
        ].map(([label, cls]) => (
          <span key={label} className={cn("rounded px-2 py-0.5", cls)}>
            {label}
          </span>
        ))}
        <span className="text-muted-foreground">
          {mapping
            ? `Header row ${mapping.headerRow} — filled columns are shown above.`
            : "No student table detected on this sheet. Use Map columns."}
        </span>
      </div>

      {data && (
        <div className="max-h-[28rem] overflow-auto rounded-lg border">
          <table className="border-collapse text-[11px]">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="sticky left-0 border bg-muted px-2 py-1 text-left">
                  Row
                </th>
                {cols.map((c) => {
                  const role = roleOf(c, mapping);
                  return (
                    <th
                      key={c}
                      className={cn(
                        "border px-2 py-1 text-left font-medium",
                        role?.cls,
                      )}
                    >
                      <div>{colLetter(c)}</div>
                      {role && (
                        <div className="text-[9px] font-normal">{role.label}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr
                  key={r.row}
                  className={cn(
                    mapping?.headerRow === r.row && "bg-muted/60 font-semibold",
                  )}
                >
                  <td className="sticky left-0 border bg-muted px-2 py-0.5 text-muted-foreground">
                    {r.row}
                  </td>
                  {r.cells.map((text, i) => (
                    <td
                      key={i}
                      className={cn(
                        "max-w-[220px] truncate whitespace-nowrap border px-2 py-0.5",
                        roleOf(i + 1, mapping)?.cls,
                      )}
                      title={text}
                    >
                      {text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Rows {first}-{last} of {data.rowCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={offset + LIMIT >= data.rowCount || loading}
            onClick={() => setOffset(offset + LIMIT)}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function TemplatePreview({
  templateId,
  refreshKey,
}: {
  templateId: string;
  refreshKey: number;
}): React.ReactElement {
  const [mode, setMode] = useState<Mode>("file");

  const modes: Array<{ id: Mode; label: string }> = [
    { id: "file", label: "As uploaded" },
    { id: "roles", label: "Detected columns" },
  ];

  return (
    <div className="space-y-3">
      <div className="inline-flex gap-1 rounded-lg border p-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              mode === m.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <TemplateViewer templateId={templateId} refreshKey={refreshKey} />
      ) : (
        <RolesGrid templateId={templateId} refreshKey={refreshKey} />
      )}
    </div>
  );
}