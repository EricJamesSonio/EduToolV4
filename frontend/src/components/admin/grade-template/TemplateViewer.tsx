"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { colLetter, readErrorMessage } from "@/api/grade-template.api";
import {
  gradeTemplateViewApi,
  type SheetView,
  type ViewStyle,
} from "@/api/grade-template-view.api";

const FULL_LIMIT = 5000;
const PAGED_LIMIT = 100;
const GRID = "1px solid #e5e7eb";
const GUTTER = 44;

type Size = "full" | "paged";

function cellCss(s: ViewStyle | undefined, showGrid: boolean): CSSProperties {
  const grid = showGrid ? GRID : undefined;
  return {
    backgroundColor: s?.bg,
    color: s?.color ?? "#000000",
    fontWeight: s?.bold ? 700 : 400,
    fontStyle: s?.italic ? "italic" : "normal",
    textDecoration: s?.underline ? "underline" : "none",
    fontSize: s?.size ? Math.round(s.size * 1.25) : 13,
    textAlign: s?.align ?? "left",
    verticalAlign:
      s?.valign === "middle" ? "middle" : s?.valign === "top" ? "top" : "bottom",
    whiteSpace: s?.wrap ? "normal" : "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "1px 4px",
    borderTop: s?.bt ?? grid,
    borderRight: s?.br ?? grid,
    borderBottom: s?.bb ?? grid,
    borderLeft: s?.bl ?? grid,
  };
}

export function TemplateViewer({
  templateId,
  refreshKey,
}: {
  templateId: string;
  refreshKey: number;
}): React.ReactElement {
  const [data, setData] = useState<SheetView | null>(null);
  const [sheet, setSheet] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [size, setSize] = useState<Size>("full");
  const [loading, setLoading] = useState(false);
  const [jump, setJump] = useState("");

  const limit = size === "full" ? FULL_LIMIT : PAGED_LIMIT;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await gradeTemplateViewApi.view(templateId, {
          sheet,
          offset,
          limit,
        }),
      );
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [templateId, sheet, offset, limit]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const goTo = () => {
    const n = Number(jump);
    if (!Number.isInteger(n) || n < 1 || !data) return;
    setOffset(Math.floor((Math.min(n, data.rowCount) - 1) / limit) * limit);
    setJump("");
  };

  const totalWidth = data
    ? data.cols.filter((c) => !c.hidden).reduce((n, c) => n + c.w, GUTTER)
    : 0;

  const needsPaging = !!data && data.rowCount > limit;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {data?.sheetInfo.map((s) => (
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
            {s.name}{" "}
            <span className="font-normal opacity-70">({s.rowCount})</span>
          </button>
        ))}
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

        <div className="ml-auto inline-flex gap-1 rounded-lg border p-1">
          {(
            [
              ["full", "Full sheet"],
              ["paged", `Paged (${PAGED_LIMIT} rows)`],
            ] as Array<[Size, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setSize(id);
                setOffset(0);
              }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                size === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        The uploaded workbook as it was saved. Logos and images are not shown
        here but stay in the file.
        {size === "full" &&
          needsPaging &&
          ` This sheet has more than ${FULL_LIMIT} rows, so it is shown in steps of ${FULL_LIMIT}.`}
      </p>

      {data && (
        <div className="max-h-[70vh] overflow-auto rounded-lg border bg-white text-black">
          <table
            style={{
              borderCollapse: "collapse",
              tableLayout: "fixed",
              width: totalWidth,
            }}
          >
            <colgroup>
              <col style={{ width: GUTTER }} />
              {data.cols.map((c, i) =>
                c.hidden ? null : <col key={i} style={{ width: c.w }} />,
              )}
            </colgroup>
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    zIndex: 3,
                    background: "#f3f4f6",
                    border: GRID,
                  }}
                />
                {data.cols.map((c, i) =>
                  c.hidden ? null : (
                    <th
                      key={i}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        border: GRID,
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#6b7280",
                        padding: "2px 4px",
                      }}
                    >
                      {colLetter(i + 1)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) =>
                r.hidden ? null : (
                  <tr key={r.row} style={{ height: r.h ?? 20 }}>
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        background: "#f3f4f6",
                        border: GRID,
                        fontSize: 11,
                        color: "#6b7280",
                        textAlign: "center",
                      }}
                    >
                      {r.row}
                    </td>
                    {r.cells.map((cell, i) =>
                      data.cols[i]?.hidden || cell.skip ? null : (
                        <td
                          key={i}
                          colSpan={cell.cs}
                          rowSpan={cell.rs}
                          title={cell.t}
                          style={cellCss(data.styles[cell.s], data.showGrid)}
                        >
                          {cell.t}
                        </td>
                      ),
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            Rows {data.first}-{data.last} of {data.rowCount}
          </span>
          {needsPaging && (
            <>
              <input
                className="w-24 rounded-md border bg-background px-2 py-1 text-xs"
                placeholder="Go to row"
                value={jump}
                onChange={(e) => setJump(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goTo();
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="ml-auto gap-1"
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={offset + limit >= data.rowCount || loading}
                onClick={() => setOffset(offset + limit)}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}