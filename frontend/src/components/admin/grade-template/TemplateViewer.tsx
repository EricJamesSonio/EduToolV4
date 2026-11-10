"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { readErrorMessage } from "@/api/grade-template.api";
import {
  gradeTemplateViewApi,
  type SheetView,
  type ViewStyle,
} from "@/api/grade-template-view.api";

const FULL_LIMIT = 20000;
const GRID = "1px solid #e5e7eb";

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

// One sheet drawn exactly as stored in the file: no added column letters or
// row numbers and no height cap. "fit" scales the whole sheet to the page
// width so every column is visible; "actual" shows 100% and scrolls sideways.
function SheetGrid({
  data,
  zoom,
}: {
  data: SheetView;
  zoom: Zoom;
}): React.ReactElement {
  const outer = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const [avail, setAvail] = useState(0);
  const [tableH, setTableH] = useState(0);

  const totalWidth = data.cols
    .filter((c) => !c.hidden)
    .reduce((n, c) => n + c.w, 0);

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
    zoom === "fit" && avail > 0 && totalWidth > 0
      ? Math.min(1, avail / totalWidth)
      : 1;

  return (
    <div
      ref={outer}
      className={cn(
        "rounded-lg border bg-white text-black",
        zoom === "fit" ? "overflow-hidden" : "overflow-x-auto",
      )}
    >
      <div
        style={{
          width: totalWidth * scale,
          height: scale < 1 && tableH > 0 ? tableH * scale : undefined,
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
            {data.cols.map((c, i) =>
              c.hidden ? null : <col key={i} style={{ width: c.w }} />,
            )}
          </colgroup>
          <tbody>
            {data.rows.map((r) =>
              r.hidden ? null : (
                <tr key={r.row} style={{ height: r.h ?? 20 }}>
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
  const [view, setView] = useState<SheetView | null>(null);
  const [sheetInfo, setSheetInfo] = useState<
    Array<{ name: string; rowCount: number }>
  >([]);
  // null = not chosen yet; the first load picks the biggest sheet.
  const [sheet, setSheet] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const mine = ++requestId.current;
    setLoading(true);
    try {
      if (sheet === null) {
        // Cheap first call just to learn the sheet list, then open the
        // largest sheet (the template itself).
        const probe = await gradeTemplateViewApi.view(
          templateId,
          { offset: 0, limit: 1 },
          refreshKey,
        );
        if (mine !== requestId.current) return;
        setSheetInfo(probe.sheetInfo);
        const biggest = probe.sheetInfo.reduce(
          (best, s) => (s.rowCount > best.rowCount ? s : best),
          probe.sheetInfo[0] ?? { name: probe.sheetName, rowCount: 0 },
        );
        setSheet(biggest.name);
        return;
      }

      const v = await gradeTemplateViewApi.view(
        templateId,
        { sheet, offset: 0, limit: FULL_LIMIT },
        refreshKey,
      );
      if (mine !== requestId.current) return;
      setSheetInfo(v.sheetInfo);
      setView(v);
    } catch (err) {
      if (mine === requestId.current) {
        toast.error(await readErrorMessage(err));
      }
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, [templateId, sheet, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const truncated = !!view && view.rowCount > view.last;

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
        {sheetInfo.map((s) => (
          <button
            key={s.name}
            onClick={() => setSheet(s.name)}
            className={tabClass(sheet === s.name)}
          >
            {s.name}{" "}
            <span className="font-normal opacity-70">({s.rowCount})</span>
          </button>
        ))}
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

        <div className="ml-auto inline-flex gap-1 rounded-lg border bg-background p-1">
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
      </div>

      <p className="text-xs text-muted-foreground">
        The uploaded workbook as it was saved. Logos and images are not shown
        here but stay in the file.
        {zoom === "fit"
          ? " Scaled so every column fits the page; choose 100% to read at actual size."
          : " Shown at actual size; scroll sideways for wide sheets."}
      </p>

      {truncated && view && (
        <p className="text-xs text-amber-600">
          Showing the first {view.last} of {view.rowCount} rows (row limit).
        </p>
      )}

      {view && <SheetGrid key={view.sheetName} data={view} zoom={zoom} />}
    </div>
  );
}