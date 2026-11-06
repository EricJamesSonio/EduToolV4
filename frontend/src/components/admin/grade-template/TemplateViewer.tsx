"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const FULL_LIMIT = 20000;
const PAGED_LIMIT = 100;
const GRID = "1px solid #e5e7eb";
const GUTTER = 44;
const ALL = "__all__";

type Size = "full" | "paged";
type Zoom = "fit" | "actual";

// `spill` = the next cell is empty, so unwrapped text may run over it the way
// Excel draws it instead of being clipped at the cell edge.
function cellCss(
  s: ViewStyle | undefined,
  showGrid: boolean,
  spill: boolean,
): CSSProperties {
  const grid = showGrid ? GRID : undefined;
  const wrap = !!s?.wrap;
  return {
    backgroundColor: s?.bg,
    color: s?.color ?? "#000000",
    fontFamily: "Calibri, Carlito, Arial, sans-serif",
    fontWeight: s?.bold ? 700 : 400,
    fontStyle: s?.italic ? "italic" : "normal",
    textDecoration: s?.underline ? "underline" : "none",
    fontSize: s?.size ? Math.round((s.size * 4) / 3) : 15,
    textAlign: s?.align ?? "left",
    verticalAlign:
      s?.valign === "middle" ? "middle" : s?.valign === "top" ? "top" : "bottom",
    whiteSpace: wrap ? "normal" : "nowrap",
    overflow: !wrap && spill ? "visible" : "hidden",
    textOverflow: "clip",
    position: !wrap && spill ? "relative" : undefined,
    zIndex: !wrap && spill ? 1 : undefined,
    padding: "1px 4px",
    borderTop: s?.bt ?? grid,
    borderRight: s?.br ?? grid,
    borderBottom: s?.bb ?? grid,
    borderLeft: s?.bl ?? grid,
  };
}

// One sheet drawn at its natural size, scaled down to the width of its
// container in "fit" mode. `bare` removes the frame so several sheets can be
// stacked flush inside one shared frame.
function SheetGrid({
  data,
  zoom,
  bare,
}: {
  data: SheetView;
  zoom: Zoom;
  bare?: boolean;
}): React.ReactElement {
  const outer = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const [avail, setAvail] = useState(0);
  const [tableH, setTableH] = useState(0);

  const totalWidth = data.cols
    .filter((c) => !c.hidden)
    .reduce((n, c) => n + c.w, GUTTER);

  useEffect(() => {
    const o = outer.current;
    const t = table.current;
    if (!o || !t) return;
    const measure = () => {
      setAvail(o.clientWidth);
      setTableH(t.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(t);
    return () => ro.disconnect();
  }, [data]);

  const scale =
    zoom === "fit" && avail > 0 ? Math.min(1, avail / totalWidth) : 1;

  return (
    <div
      ref={outer}
      className={cn(
        "bg-white text-black",
        !bare && "rounded-lg border",
        zoom === "fit"
          ? "overflow-hidden"
          : bare
            ? undefined
            : "overflow-x-auto",
      )}
    >
      <div
        style={{
          width: totalWidth * scale,
          height: tableH > 0 ? tableH * scale : undefined,
        }}
      >
        <table
          ref={table}
          style={{
            borderCollapse: "collapse",
            tableLayout: "fixed",
            width: totalWidth,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
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
              <th style={{ background: "#f3f4f6", border: GRID }} />
              {data.cols.map((c, i) =>
                c.hidden ? null : (
                  <th
                    key={i}
                    style={{
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
                      background: "#f3f4f6",
                      border: GRID,
                      fontSize: 11,
                      color: "#6b7280",
                      textAlign: "center",
                    }}
                  >
                    {r.row}
                  </td>
                  {r.cells.map((cell, i) => {
                    if (data.cols[i]?.hidden || cell.skip) return null;
                    const next = r.cells[i + 1];
                    const spill =
                      cell.t !== "" &&
                      !cell.cs &&
                      !!next &&
                      !next.skip &&
                      next.t === "";
                    return (
                      <td
                        key={i}
                        colSpan={cell.cs}
                        rowSpan={cell.rs}
                        style={cellCss(
                          data.styles[cell.s],
                          data.showGrid,
                          spill,
                        )}
                      >
                        {cell.t}
                      </td>
                    );
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TemplateViewer({
  templateId,
  refreshKey,
}: {
  templateId: string;
  refreshKey: number;
}): React.ReactElement {
  const [views, setViews] = useState<SheetView[]>([]);
  const [sheetInfo, setSheetInfo] = useState<
    Array<{ name: string; rowCount: number }>
  >([]);
  const [sheet, setSheet] = useState<string>(ALL);
  const [offset, setOffset] = useState(0);
  const [size, setSize] = useState<Size>("full");
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [loading, setLoading] = useState(false);
  const [jump, setJump] = useState("");
  const requestId = useRef(0);

  const isAll = sheet === ALL;
  const limit = size === "full" ? FULL_LIMIT : PAGED_LIMIT;

  const load = useCallback(async () => {
    const mine = ++requestId.current;
    setLoading(true);
    try {
      let nextViews: SheetView[];
      let nextInfo: Array<{ name: string; rowCount: number }>;

      if (isAll) {
        nextViews = await gradeTemplateViewApi.viewAll(templateId, refreshKey);
        nextInfo = nextViews[0]?.sheetInfo ?? [];
      } else {
        const v = await gradeTemplateViewApi.view(
          templateId,
          { sheet, offset, limit },
          refreshKey,
        );
        nextInfo = v.sheetInfo;
        nextViews = [v];
      }

      if (mine !== requestId.current) return;
      setSheetInfo(nextInfo);
      setViews(nextViews);
    } catch (err) {
      if (mine === requestId.current) {
        toast.error(await readErrorMessage(err));
      }
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, [templateId, sheet, offset, limit, isAll, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const single = !isAll && views.length === 1 ? views[0] : null;
  const truncated = isAll ? views.filter((v) => v.rowCount > v.last) : [];

  const goTo = () => {
    const n = Number(jump);
    if (!Number.isInteger(n) || n < 1 || !single) return;
    setOffset(Math.floor((Math.min(n, single.rowCount) - 1) / limit) * limit);
    setJump("");
  };

  const needsPaging = !!single && single.rowCount > limit;

  const tabClass = (active: boolean) =>
    cn(
      "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background text-muted-foreground hover:text-foreground",
    );

  const toggleClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {sheetInfo.length > 0 && (
          <button
            onClick={() => {
              setSheet(ALL);
              setOffset(0);
            }}
            className={tabClass(isAll)}
          >
            All sheets
          </button>
        )}
        {sheetInfo.map((s) => (
          <button
            key={s.name}
            onClick={() => {
              setSheet(s.name);
              setOffset(0);
            }}
            className={tabClass(sheet === s.name)}
          >
            {s.name}{" "}
            <span className="font-normal opacity-70">({s.rowCount})</span>
          </button>
        ))}
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex gap-1 rounded-lg border bg-background p-1">
            <button
              onClick={() => setZoom("fit")}
              className={toggleClass(zoom === "fit")}
            >
              Fit to width
            </button>
            <button
              onClick={() => setZoom("actual")}
              className={toggleClass(zoom === "actual")}
            >
              100%
            </button>
          </div>

          {!isAll && (
            <div className="inline-flex gap-1 rounded-lg border bg-background p-1">
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
                  className={toggleClass(size === id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The uploaded workbook as it was saved. Logos and images are not shown
        here but stay in the file.
        {zoom === "fit"
          ? " Scaled to fit the page; choose 100% to read at actual size."
          : " Shown at actual size; scroll sideways for wide sheets."}
      </p>

      {truncated.length > 0 && (
        <p className="text-xs text-amber-600">
          {truncated.map((v) => `${v.sheetName} (first ${v.last} of ${v.rowCount} rows)`).join(", ")}{" "}
          is cut at the row limit. Open that sheet on its own to read the rest.
        </p>
      )}

      {isAll && views.length > 0 && (
        <div
          className={cn(
            "overflow-hidden rounded-lg border bg-white",
            zoom === "actual" && "overflow-x-auto",
          )}
        >
          {views.map((v) => (
            <SheetGrid key={v.sheetName} data={v} zoom={zoom} bare />
          ))}
        </div>
      )}

      {single && <SheetGrid data={single} zoom={zoom} />}

      {single && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            Rows {single.first}-{single.last} of {single.rowCount}
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
                disabled={offset + limit >= single.rowCount || loading}
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