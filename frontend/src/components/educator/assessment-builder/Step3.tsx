import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS, Q_TYPES } from "./constants";
import { makeSection, defaultSectionTitle } from "./utils";
import { ConceptSectionGrid } from "./ConceptSectionGrid";
import type {
  AssessmentSection,
  ConceptItemInfo,
  BuilderState,
  GradingMode,
  QuestionType,
} from "./types";
import type { AssessmentType } from "@/types/educator/assessment.types";

export function Step3({
  type,
  title,
  totalItems,
  sections,
  conceptItems,
  sectionNames,
  schemeTypes,
  gradingMode,
  showBreakdown,
  manualMaxScore,
  onChange,
  onNext,
  isLoading,
}: {
  type: string;
  title: string;
  totalItems: number;
  sections: AssessmentSection[];
  conceptItems: ConceptItemInfo[];
  sectionNames: string[];
  schemeTypes: string[];
  gradingMode: GradingMode;
  showBreakdown: boolean;
  manualMaxScore: number;
  onChange: (
    u: Partial<
      Pick<
        BuilderState,
        | "type"
        | "title"
        | "totalItems"
        | "sections"
        | "gradingMode"
        | "showBreakdown"
        | "manualMaxScore"
      >
    >
  ) => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const aiItemCount = sections
    .filter((sec) => sec.questionType !== "manual")
    .reduce((s, sec) => s + (sec.to - sec.from + 1), 0);
  const manualScoreTotal = sections
    .filter((sec) => sec.questionType === "manual")
    .reduce((s, sec) => s + (sec.manualMaxScore ?? 1), 0);
  const hasManualSections = sections.some(
    (sec) => sec.questionType === "manual"
  );
  const overallTotal = totalItems + manualScoreTotal;
  const totalCovered = aiItemCount;
  const gap = totalCovered < totalItems;
  const overflow = totalCovered > totalItems;

  const itemErrors: string[] = [];
  let expectedFrom = 1;
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (sec.questionType === "manual") {
      if (!sec.manualQuestionText?.trim()) {
        itemErrors.push(
          `"${sec.title || defaultSectionTitle(sec.questionType)}" requires question text.`
        );
      }
      continue;
    }
    const count = sec.to - sec.from + 1;
    if (sec.from !== expectedFrom) {
      itemErrors.push(
        `Section "${sec.title || defaultSectionTitle(sec.questionType)}" starts at ${sec.from} but expected ${expectedFrom}.`
      );
    }
    if (sec.to > totalItems) {
      itemErrors.push(
        `Section "${sec.title || defaultSectionTitle(sec.questionType)}" ends at ${sec.to} but total items is ${totalItems}.`
      );
    }
    if (sec.selectedItemIndices.length < count) {
      itemErrors.push(
        `"${sec.title || defaultSectionTitle(sec.questionType)}" needs ${count} items, but only ${sec.selectedItemIndices.length} selected.`
      );
    }
    expectedFrom = sec.to + 1;
  }

  const aiItemErr =
    aiItemCount > conceptItems.length
      ? `AI sections total ${aiItemCount} items but concept build only has ${conceptItems.length}.`
      : null;
  const totalErr = totalItems < 1 ? "Must be at least 1." : null;

  const valid =
    !totalErr && !aiItemErr && !overflow && !gap && itemErrors.length === 0;

  function recalcAll(arr: AssessmentSection[]): AssessmentSection[] {
    let cursor = 0;
    return arr.map((sec) => {
      if (sec.questionType === "manual")
        return { ...sec, from: 1, to: 1 };
      const count = sec.to - sec.from + 1;
      const from = cursor + 1;
      const to = cursor + count;
      cursor = to;
      return { ...sec, from, to };
    });
  }

  function setSectionCount(idx: number, newCount: number) {
    const clamped = Math.max(1, newCount);
    const arr = sections.map((sec, i) => {
      if (i === idx) {
        const from = sec.from;
        const to = from + clamped - 1;
        const trimmed = sec.selectedItemIndices.slice(0, clamped);
        return { ...sec, from, to, selectedItemIndices: trimmed };
      }
      return sec;
    });
    for (let i = idx + 1; i < arr.length; i++) {
      if (arr[i].questionType === "manual") continue;
      const prevAI = [...arr.slice(0, i)]
        .reverse()
        .find((s) => s.questionType !== "manual");
      const from = prevAI ? prevAI.to + 1 : 1;
      const curCount = arr[i].to - arr[i].from + 1;
      arr[i] = { ...arr[i], from, to: from + curCount - 1 };
    }
    onChange({ sections: arr });
  }

  function addSectionWithType(qType: QuestionType) {
    setShowTypePicker(false);
    if (qType === "manual") {
      onChange({ sections: [...sections, makeSection(1, 1, "manual")] });
    } else {
      const lastAI = [...sections]
        .reverse()
        .find((s) => s.questionType !== "manual");
      const nextFrom = lastAI ? lastAI.to + 1 : 1;
      if (nextFrom > totalItems) return;
      const to = Math.min(nextFrom + 4, totalItems);
      onChange({ sections: [...sections, makeSection(nextFrom, to, qType)] });
    }
  }

  function updateSection(idx: number, u: Partial<AssessmentSection>) {
    const updated = sections.map((sec, i) => {
      if (i !== idx) return sec;
      const next = { ...sec, ...u };
      if (u.questionType === "manual" && sec.questionType !== "manual") {
        next.from = 1;
        next.to = 1;
        next.manualMaxScore = next.manualMaxScore ?? 1;
        next.manualQuestionText = next.manualQuestionText ?? "";
      }
      return next;
    });
    onChange({ sections: updated });
  }

  function removeSection(idx: number) {
    const remaining = sections.filter((_, i) => i !== idx);
    onChange({ sections: recalcAll(remaining) });
  }

  function moveSection(fromIdx: number, toIdx: number) {
    const arr = [...sections];
    [arr[fromIdx], arr[toIdx]] = [arr[toIdx], arr[fromIdx]];
    onChange({ sections: recalcAll(arr) });
  }

  const grouped = sectionNames.map((name) => ({
    section: name,
    items: conceptItems.filter((ci) => ci.section === name),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Assessment Type <span className="text-destructive">*</span>
            </label>
            <select
              value={type}
              onChange={(e) =>
                onChange({ type: e.target.value as AssessmentType })
              }
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            >
              {schemeTypes.length > 0
                ? schemeTypes.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t] ??
                        t
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))
                : (["quiz", "activity", "exam", "custom"] as const).map(
                    (t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    )
                  )}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Quiz 2"
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Total Items <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={totalItems}
              onChange={(e) =>
                onChange({
                  totalItems: Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
              className={cn(
                "w-full rounded-md border bg-card px-3 py-2 text-sm",
                totalErr && "border-destructive"
              )}
            />
            {totalErr ? (
              <p className="text-xs text-destructive">{totalErr}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                System-generated items count. Concept build limit (
                {conceptItems.length}) only applies to AI sections.
              </p>
            )}
          </div>
        </div>
      </div>

      {hasManualSections && (
        <div className="rounded-lg border bg-[#93C5FD] border-[#60A5FA] text-[#0B1E3A] px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            Overall Total (AI + Manual):
          </span>
          <span className="font-semibold text-lg">{overallTotal}</span>
          <span className="text-xs text-muted-foreground">
            ({aiItemCount} AI + {manualScoreTotal} Manual)
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between relative">
          <h3 className="text-sm font-semibold">
            Assessment Sections ({sections.length})
          </h3>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTypePicker(!showTypePicker)}
            >
              + Add Section
            </Button>
            {showTypePicker && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTypePicker(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border bg-popover p-1 shadow-lg">
                  {Q_TYPES.map((opt) => {
                    const isAi = opt.value !== "manual";
                    const aiSlotsFull = aiItemCount >= totalItems;
                    const conceptFull = aiItemCount >= conceptItems.length;
                    const aiFull = isAi && (aiSlotsFull || conceptFull);
                    const aiReason = conceptFull
                      ? "concept build full"
                      : aiSlotsFull
                        ? "all slots filled"
                        : "";
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={aiFull}
                        onClick={() =>
                          !aiFull && addSectionWithType(opt.value)
                        }
                        className={cn(
                          "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                          aiFull
                            ? "opacity-40 cursor-not-allowed text-muted-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="font-medium">{opt.label}</span>
                        {aiFull && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            ({aiReason})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {sections.length === 0 && (
          <p className="text-xs text-muted-foreground py-6 text-center border rounded-lg">
            No sections yet. Click &quot;+ Add Section&quot; to create one.
          </p>
        )}

        <div className="space-y-4">
          {sections.map((sec, si) => {
            const secCount = sec.to - sec.from + 1;
            const hasEnoughItems =
              sec.selectedItemIndices.length >= secCount;

            return (
              <div
                key={sec.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={sec.title}
                    placeholder={defaultSectionTitle(sec.questionType)}
                    onChange={(e) =>
                      updateSection(si, { title: e.target.value })
                    }
                    className="flex-1 rounded border bg-background px-3 py-1.5 text-sm font-medium"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={si === 0}
                      onClick={() => moveSection(si, si - 1)}
                      className="disabled:opacity-20 hover:text-primary"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={si === sections.length - 1}
                      onClick={() => moveSection(si, si + 1)}
                      className="disabled:opacity-20 hover:text-primary"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(si)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  {sec.questionType === "manual" ? (
                    <div className="space-y-1 w-24">
                      <label className="text-xs text-muted-foreground">
                        Max Score
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={sec.manualMaxScore ?? 1}
                        onChange={(e) =>
                          updateSection(si, {
                            manualMaxScore: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          })
                        }
                        className="w-full rounded-md border bg-card px-3 py-1.5 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 w-20">
                        <label className="text-xs text-muted-foreground">
                          From (Items)
                        </label>
                        <input
                          type="number"
                          value={sec.from}
                          disabled
                          className="w-full rounded-md border bg-muted/30 px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div className="space-y-1 w-20">
                        <label className="text-xs text-muted-foreground">
                          Count
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={totalItems - sec.from + 1}
                          value={secCount}
                          onChange={(e) =>
                            setSectionCount(
                              si,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-full rounded-md border bg-card px-3 py-1.5 text-sm"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">
                      Type
                    </label>
                    <select
                      value={sec.questionType}
                      onChange={(e) =>
                        updateSection(si, {
                          questionType: e.target.value as QuestionType,
                        })
                      }
                      className="w-full rounded-md border bg-card px-3 py-1.5 text-sm"
                    >
                      {Q_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {sec.questionType !== "manual" && (
                    <div
                      className={cn(
                        "text-xs",
                        hasEnoughItems
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {sec.selectedItemIndices.length} / {secCount} items
                    </div>
                  )}
                </div>

                {sec.questionType === "manual" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Question / Prompt{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={sec.manualQuestionText ?? ""}
                      onChange={(e) =>
                        updateSection(si, {
                          manualQuestionText: e.target.value,
                        })
                      }
                      placeholder="Write the question or prompt students will respond to. This will be manually graded."
                      rows={4}
                      className="w-full rounded-md border bg-card px-3 py-2 text-sm resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <ConceptSectionGrid
                      grouped={grouped}
                      selectedItemIndices={sec.selectedItemIndices}
                      sectionIndex={si}
                      onUpdateSection={updateSection}
                    />
                    {!hasEnoughItems && (
                      <p className="text-xs text-destructive">
                        Select at least {secCount} item
                        {secCount > 1 ? "s" : ""} from the concept sections
                        above.
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {itemErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 space-y-1">
          {itemErrors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}
      {aiItemErr && <p className="text-xs text-destructive">{aiItemErr}</p>}

      <div className="flex items-center gap-3 pt-1">
        <p
          className={cn(
            "text-sm",
            valid
              ? "text-success"
              : gap
                ? "text-warning"
                : overflow
                  ? "text-destructive"
                  : "text-warning"
          )}
        >
          {totalCovered} / {totalItems} AI items covered
          {hasManualSections && (
            <span className="text-muted-foreground ml-2">
              · Overall: {overallTotal}
            </span>
          )}
          {gap && " — add more sections"}
          {overflow && " — exceeds total"}
        </p>
        <Button onClick={onNext} disabled={!valid || isLoading} size="sm">
          {isLoading && (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          )}
          Generate
        </Button>
      </div>
    </div>
  );
}

