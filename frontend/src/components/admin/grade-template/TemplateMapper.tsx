"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const MAX_SLOTS = 20;

type SlotKey = "nameCols" | "subjectCols" | "termSlots";

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
    nameCols: [0],
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
  const termSlots = Array.from({ length: max }, () => 0);
  for (const t of m.termCols) termSlots[t.termIndex - 1] = t.col;
  return {
    headerRow: m.headerRow,
    idCol: m.idCol ?? 0,
    nameCols: m.nameCols.length > 0 ? m.nameCols : [0],
    subjectCols: m.subjectCols,
    termSlots,
    finalCol: m.finalCol ?? 0,
    remarkCol: m.remarkCol ?? 0,
    valueMode: m.valueMode ?? "",
  };
}

function usedColumns(d: Draft): number[] {
  return [
    d.idCol,
    d.finalCol,
    d.remarkCol,
    ...d.nameCols,
    ...d.subjectCols,
    ...d.termSlots,
  ].filter((c) => c > 0);
}

function pickedColumns(slots: number[]): number[] {
  return [...new Set(slots.filter((c) => c > 0))];
}

function toMapping(d: Draft): SheetMapping {
  return {
    headerRow: d.headerRow,
    idCol: d.idCol || null,
    nameCols: pickedColumns(d.nameCols),
    subjectCols: pickedColumns(d.subjectCols),
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
  taken,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  columns: MappingColumn[];
  taken: Set<number>;
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
          <option
            key={c.col}
            value={c.col}
            disabled={taken.has(c.col) && c.col !== value}
          >
            {optionLabel(c)}
          </option>
        ))}
      </select>
      {hint && (
        <span className="block font-normal text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

// A growable list of column dropdowns (terms, name parts, subject parts).
function SlotList({
  title,
  itemLabel,
  addLabel,
  hint,
  slots,
  columns,
  taken,
  min = 0,
  onChange,
}: {
  title: string;
  itemLabel: string;
  addLabel: string;
  hint?: string;
  slots: number[];
  columns: MappingColumn[];
  taken: Set<number>;
  min?: number;
  onChange: (slots: number[]) => void;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">{title}</p>
      {slots.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {slots.map((col, i) => (
            <ColSelect
              key={i}
              label={`${itemLabel} ${i + 1}`}
              value={col}
              columns={columns}
              taken={taken}
              onChange={(v) =>
                onChange(slots.map((x, j) => (j === i ? v : x)))
              }
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => onChange([...slots, 0])}
          disabled={slots.length >= MAX_SLOTS}
        >
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
        {slots.length > min && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => onChange(slots.slice(0, -1))}
          >
            <X className="h-3.5 w-3.5" /> Remove last
          </Button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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

  const taken = useMemo(
    () => new Set(draft ? usedColumns(draft) : []),
    [draft],
  );

  const columns = useMemo(
    () =>
      (info?.columns ?? []).filter(
        (c) => c.header !== "" || c.sample !== "" || taken.has(c.col),
      ),
    [info, taken],
  );

  if (!info || !draft) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading columns...
      </div>
    );
  }

  const patch = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
  const setSlots = (key: SlotKey, slots: number[]) =>
    setDraft({ ...draft, [key]: slots });

  const applyHeaderRow = () => {
    const n = Number(headerInput);
    if (!Number.isInteger(n) || n < 1) {
      toast.error("Header row must be a whole number of 1 or more.");
      return;
    }
    void load(info.sheetName, n, true);
  };

  const persist = async (mapping: SheetMapping | null, message: string) => {
    setSaving(true);
    try {
      const analysis = await gradeTemplateApi.saveMapping(
        templateId,
        info.sheetName,
        mapping,
      );
      toast.success(message);
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
          taken={taken}
          onChange={(v) => patch({ idCol: v })}
        />
        <ColSelect
          label="Overall / final column"
          hint="Weighted average of the term scores, using the template's term-weight row when it has one."
          value={draft.finalCol}
          columns={columns}
          taken={taken}
          onChange={(v) => patch({ finalCol: v })}
        />
        <ColSelect
          label="Remarks column"
          value={draft.remarkCol}
          columns={columns}
          taken={taken}
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

      <SlotList
        title="Student name column(s)"
        itemLabel="Name column"
        addLabel="Add name column"
        hint="Add more than one if the name is split (last name, first name)."
        slots={draft.nameCols}
        columns={columns}
        taken={taken}
        min={1}
        onChange={(s) => setSlots("nameCols", s)}
      />

      <SlotList
        title="Subject column(s)"
        itemLabel="Subject column"
        addLabel="Add subject column"
        hint="Needed when one sheet lists several subjects: each row is matched to the educator's subject by its code or title."
        slots={draft.subjectCols}
        columns={columns}
        taken={taken}
        onChange={(s) => setSlots("subjectCols", s)}
      />

      <SlotList
        title="Term columns"
        itemLabel="Term"
        addLabel="Add term column"
        slots={draft.termSlots}
        columns={columns}
        taken={taken}
        onChange={(s) => setSlots("termSlots", s)}
      />

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
            onClick={() => void persist(null, "Back to auto-detect.")}
          >
            Reset to auto-detect
          </Button>
        )}
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          disabled={saving}
          onClick={() => void persist(toMapping(draft), "Mapping saved.")}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save mapping
        </Button>
      </div>
    </div>
  );
}