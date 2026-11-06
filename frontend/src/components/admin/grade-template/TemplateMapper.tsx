"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  colLetter,
  gradeTemplateApi,
  readErrorMessage,
  type MappingColumn,
  type MappingInfo,
  type SheetMapping,
  type TemplateAnalysis,
} from "@/api/grade-template.api";

const FIELD =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

// 0 means "not used" in every column slot.
interface Draft {
  headerRow: number;
  idCol: number;
  nameCols: number[];
  subjectCols: number[];
  termSlots: number[];
  finalCol: number;
  remarkCol: number;
  valueMode: "" | "grade" | "score";
}

function emptyDraft(headerRow: number): Draft {
  return {
    headerRow,
    idCol: 0,
    nameCols: [],
    subjectCols: [],
    termSlots: [],
    finalCol: 0,
    remarkCol: 0,
    valueMode: "",
  };
}

function toDraft(m: SheetMapping | null, headerRow: number): Draft {
  if (!m) return emptyDraft(headerRow);
  const max = m.termCols.reduce((n, t) => Math.max(n, t.termIndex), 0);
  const slots = Array.from({ length: max }, () => 0);
  for (const t of m.termCols) slots[t.termIndex - 1] = t.col;
  return {
    headerRow: m.headerRow,
    idCol: m.idCol ?? 0,
    nameCols: m.nameCols,
    subjectCols: m.subjectCols,
    termSlots: slots,
    finalCol: m.finalCol ?? 0,
    remarkCol: m.remarkCol ?? 0,
    valueMode: m.valueMode ?? "",
  };
}

function toMapping(d: Draft): SheetMapping {
  return {
    headerRow: d.headerRow,
    idCol: d.idCol || null,
    nameCols: d.nameCols,
    subjectCols: d.subjectCols,
    termCols: d.termSlots
      .map((col, i) => ({ col, termIndex: i + 1 }))
      .filter((t) => t.col > 0),
    finalCol: d.finalCol || null,
    remarkCol: d.remarkCol || null,
    valueMode: d.valueMode || null,
  };
}

function optionLabel(c: MappingColumn): string {
  const head = c.header || "(blank header)";
  return `${colLetter(c.col)} — ${head}${c.sample ? `  ·  e.g. ${c.sample}` : ""}`;
}

function ColSelect({
  label,
  hint,
  value,
  columns,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  columns: MappingColumn[];
  onChange: (v: number) => void;
}): React.ReactElement {
  return (
    <label className="space-y-1 text-xs font-medium">
      {label}
      <select
        className={FIELD}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>— not used —</option>
        {columns.map((c) => (
          <option key={c.col} value={c.col}>
            {optionLabel(c)}
          </option>
        ))}
      </select>
      {hint && <span className="block font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

function ColChips({
  label,
  hint,
  selected,
  columns,
  onToggle,
}: {
  label: string;
  hint?: string;
  selected: number[];
  columns: MappingColumn[];
  onToggle: (col: number) => void;
}): React.ReactElement {
  return (
    <div className="space-y-1 text-xs font-medium">
      <p>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {columns.map((c) => (
          <button
            key={c.col}
            type="button"
            onClick={() => onToggle(c.col)}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-normal transition-colors",
              selected.includes(c.col)
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground",
            )}
            title={c.sample ? `e.g. ${c.sample}` : undefined}
          >
            {colLetter(c.col)} · {c.header || "(blank)"}
          </button>
        ))}
      </div>
      {hint && <span className="block font-normal text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function TemplateMapper({
  templateId,
  onSaved,
}: {
  templateId: string;
  onSaved: (analysis: TemplateAnalysis) => void;
}): React.ReactElement {
  const [info, setInfo] = useState<MappingInfo | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [headerInput, setHeaderInput] = useState("1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (sheet?: string, headerRow?: number, keepDraft = false) => {
      setLoading(true);
      try {
        const data = await gradeTemplateApi.mapping(templateId, {
          sheet,
          headerRow,
        });
        setInfo(data);
        setHeaderInput(String(data.headerRow));
        setDraft((prev) =>
          keepDraft && prev
            ? { ...prev, headerRow: data.headerRow }
            : toDraft(data.effective, data.headerRow),
        );
      } catch (err) {
        toast.error(await readErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [templateId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!info || !draft) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading columns...
      </div>
    );
  }

  const patch = (p: Partial<Draft>) => setDraft({ ...draft, ...p });

  const used = new Set<number>([
    draft.idCol,
    draft.finalCol,
    draft.remarkCol,
    ...draft.nameCols,
    ...draft.subjectCols,
    ...draft.termSlots,
  ]);
  const columns = info.columns.filter(
    (c) => c.header !== "" || c.sample !== "" || used.has(c.col),
  );

  const toggle = (list: number[], col: number): number[] =>
    list.includes(col) ? list.filter((c) => c !== col) : [...list, col];

  const applyHeaderRow = () => {
    const n = Number(headerInput);
    if (!Number.isInteger(n) || n < 1) {
      toast.error("Header row must be a whole number of 1 or more.");
      return;
    }
    void load(info.sheetName, n, true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const analysis = await gradeTemplateApi.saveMapping(
        templateId,
        info.sheetName,
        toMapping(draft),
      );
      toast.success("Mapping saved.");
      onSaved(analysis);
      await load(info.sheetName);
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const analysis = await gradeTemplateApi.saveMapping(
        templateId,
        info.sheetName,
        null,
      );
      toast.success("Back to auto-detect.");
      onSaved(analysis);
      await load(info.sheetName);
    } catch (err) {
      toast.error(await readErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {info.sheets.length > 1 && (
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-xs"
            value={info.sheetName}
            onChange={(e) => void load(e.target.value)}
          >
            {info.sheets.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        {info.saved ? (
          <Badge variant="secondary">Saved mapping</Badge>
        ) : info.effective ? (
          <Badge variant="outline">Auto-detected</Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600">
            Nothing detected — map it below
          </Badge>
        )}
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>

      <p className="text-xs text-muted-foreground">
        Terms are matched by order, not by name: Term 1 gets the class&apos;s
        first term, Term 2 the next, and so on, whatever they are called
        (Prelim, Quarter 1, Term 1...). Open the Contents tab to see the sheet
        while you map.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs font-medium">
          Header row (the row holding &quot;Student No&quot;, &quot;Prelim&quot;...)
          <input
            type="number"
            min={1}
            className={cn(FIELD, "w-32")}
            value={headerInput}
            onChange={(e) => setHeaderInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyHeaderRow();
            }}
          />
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={applyHeaderRow}
          disabled={loading}
        >
          Reload columns
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColSelect
          label="Student ID column"
          hint="Students are matched by this. Leave empty to match by name."
          value={draft.idCol}
          columns={columns}
          onChange={(v) => patch({ idCol: v })}
        />
        <ColSelect
          label="Overall / final column"
          hint="Weighted average of the term scores, using the template's term-weight row when it has one."
          value={draft.finalCol}
          columns={columns}
          onChange={(v) => patch({ finalCol: v })}
        />
        <ColSelect
          label="Remarks column"
          value={draft.remarkCol}
          columns={columns}
          onChange={(v) => patch({ remarkCol: v })}
        />
        <label className="space-y-1 text-xs font-medium">
          Value to write
          <select
            className={FIELD}
            value={draft.valueMode}
            onChange={(e) =>
              patch({ valueMode: e.target.value as Draft["valueMode"] })
            }
          >
            <option value="">Auto (by column header)</option>
            <option value="grade">Grade equivalent from the grading scale</option>
            <option value="score">Percent score</option>
          </select>
        </label>
      </div>

      <ColChips
        label="Student name column(s)"
        hint="Pick more than one if the name is split (last name, first name)."
        selected={draft.nameCols}
        columns={columns}
        onToggle={(c) => patch({ nameCols: toggle(draft.nameCols, c) })}
      />

      <ColChips
        label="Subject column(s)"
        hint="Needed when one sheet lists several subjects: each row is matched to the educator's subject by its code or title."
        selected={draft.subjectCols}
        columns={columns}
        onToggle={(c) => patch({ subjectCols: toggle(draft.subjectCols, c) })}
      />

      <div className="space-y-2">
        <p className="text-xs font-medium">Term columns</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.termSlots.map((col, i) => (
            <ColSelect
              key={i}
              label={`Term ${i + 1}`}
              value={col}
              columns={columns}
              onChange={(v) =>
                patch({
                  termSlots: draft.termSlots.map((x, j) => (j === i ? v : x)),
                })
              }
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => patch({ termSlots: [...draft.termSlots, 0] })}
            disabled={draft.termSlots.length >= 20}
          >
            <Plus className="h-3.5 w-3.5" /> Add term column
          </Button>
          {draft.termSlots.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => patch({ termSlots: draft.termSlots.slice(0, -1) })}
            >
              <X className="h-3.5 w-3.5" /> Remove last
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          size="sm"
          variant="outline"
          disabled={!info.auto || saving}
          onClick={() => setDraft(toDraft(info.auto, info.auto?.headerRow ?? 1))}
        >
          Fill from auto-detect
        </Button>
        {info.saved && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={saving}
            onClick={() => void reset()}
          >
            Reset to auto-detect
          </Button>
        )}
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save mapping
        </Button>
      </div>
    </div>
  );
}