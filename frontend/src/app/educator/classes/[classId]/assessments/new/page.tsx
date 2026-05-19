"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useLessons } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import {
  useCreateAssessment,
  useAssessment,
  useUpdateAssessment,
} from "@/hooks/educator/useAssessments";
import { assessmentApi } from "@/api/educator/assessment.api";
import { educatorClassApi } from "@/api/educator/class.api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Lesson, LessonConcept } from "@/types/educator/lesson.types";
import type { AssessmentType, QuestionType, Question } from "@/types/educator/assessment.types";
import type { RangeConfig } from "@/api/educator/assessment.api";

// ─── Concept item from AI ─────────────────────────────────────────────────────
interface ConceptItemInfo {
  index: number;
  name: string;
  section: string;
  definition: string;
  difficulty: string;
}

// ─── One assessment "section" (maps to a range in the API) ────────────────────
interface AssessmentSection {
  id: string;
  title: string;
  from: number;
  to: number;
  questionType: QuestionType;
  selectedItemIndices: number[]; // indices into conceptItems[]
}

interface ConceptContent {
  sections: string[];
  keywords: string[];
  questionCapacity: Record<string, number>;
  conceptItems: ConceptItemInfo[];
}

interface BuilderState {
  selectedLesson: Lesson | null;
  type: AssessmentType;
  totalItems: number;
  sections: AssessmentSection[];
  createdAssessmentId: string | null;
  generatedQuestions: Question[];
  releaseDate: string;
  endDate: string;
  selectedStudentIds: string[];
}

const STEPS = ["Select Lesson", "View Concepts", "Configuration", "Generate", "Review Questions", "Set Dates & Assign"];

let secIdCounter = 0;
function makeSection(from: number, to: number): AssessmentSection {
  return {
    id: `sec-${++secIdCounter}`,
    title: "",
    from,
    to,
    questionType: "multiple_choice",
    selectedItemIndices: [],
  };
}

function defaultSectionTitle(type: QuestionType): string {
  const map: Record<string, string> = {
    multiple_choice: "Multiple Choice Questions",
    true_or_false: "True or False Questions",
    identification: "Identification Questions",
    enumeration: "Enumeration Questions",
    essay: "Essay Questions",
  };
  return map[type] ?? `${type.replace(/_/g, " ")} Questions`;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors", done && "bg-primary border-primary text-primary-foreground", active && "border-primary text-primary bg-background", !done && !active && "border-muted-foreground/30 text-muted-foreground/40")}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn("text-[10px] whitespace-nowrap", active ? "text-primary font-medium" : "text-muted-foreground/50")}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 w-6 mx-1 mb-4 shrink-0", i < current ? "bg-primary" : "bg-muted")} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Select Lesson ────────────────────────────────────────────────────
function Step1({ classId, selected, onSelect, onNext }: { classId: string; selected: Lesson | null; onSelect: (l: Lesson) => void; onNext: () => void }) {
  const { data: lessons, isLoading } = useLessons(classId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading lessons...</p>;
  if (!lessons?.length) return <p className="text-sm text-muted-foreground">No lessons found. Create a lesson first.</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select a lesson with a completed concept build.</p>
      <div className="space-y-2 max-w-xl">
        {lessons.map((lesson) => {
          const hasConcept = !!lesson.concept;
          return (
            <button key={lesson.id} disabled={!hasConcept} onClick={() => { onSelect(lesson); onNext(); }}
              className={cn("w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors", selected?.id === lesson.id && "border-primary bg-primary/5", hasConcept && selected?.id !== lesson.id && "hover:bg-muted/40 border-border", !hasConcept && "opacity-40 cursor-not-allowed bg-muted/20 border-border")}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{lesson.title}</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full border", hasConcept ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-100 text-zinc-500 border-zinc-200")}>{hasConcept ? "Concept ready" : "No concept build"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Week {lesson.weekNumber}{lesson.description ? ` — ${lesson.description}` : ""}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers to extract concept content ───────────────────────────────────────
function getConceptContent(concept: LessonConcept | null): ConceptContent {
  if (!concept?.content) return { sections: [], keywords: [], questionCapacity: {}, conceptItems: [] };
  const raw = concept.content as any;
  const items: ConceptItemInfo[] = Array.isArray(raw.concepts)
    ? raw.concepts.map((c: any, i: number) => ({
        index: i,
        name: c.name ?? `Item ${i + 1}`,
        section: c.section ?? "",
        definition: c.definition ?? "",
        difficulty: c.difficulty ?? "medium",
      }))
    : [];
  return {
    sections: Array.isArray(raw.sections) ? raw.sections : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    questionCapacity: raw.questionCapacity ?? {},
    conceptItems: items,
  };
}

function getTotalCapacity(concept: LessonConcept | null): number {
  const c = getConceptContent(concept);
  return Object.values(c.questionCapacity).reduce((s, v) => s + v, 0);
}

// ─── Step 2: View Concepts ────────────────────────────────────────────────────
function Step2({ concept, onNext }: { concept: LessonConcept | null; onNext: () => void }) {
  const cc = getConceptContent(concept);
  if (!cc.sections.length) return <p className="text-sm text-muted-foreground">No concept build available.</p>;
  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-muted-foreground">Review concept sections used to generate questions.</p>
      <div className="rounded-lg border divide-y">
        {cc.sections.map((name) => {
          const count = cc.conceptItems.filter((ci) => ci.section === name).length;
          return (
            <div key={name} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{count} items</span>
            </div>
          );
        })}
        <div className="px-4 py-3 flex items-center justify-between bg-muted/20">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-semibold">{cc.conceptItems.length} items</span>
        </div>
      </div>
      <Button onClick={onNext} size="sm">Next</Button>
    </div>
  );
}

// ─── Q_TYPES ──────────────────────────────────────────────────────────────────
const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_or_false", label: "True or False" },
  { value: "identification", label: "Identification" },
  { value: "enumeration", label: "Enumeration" },
  { value: "essay", label: "Essay" },
];

// ─── Step 3: Configuration (merged) ───────────────────────────────────────────
function Step3({
  type, totalItems, sections, conceptItems, sectionNames, onChange, onNext, isLoading,
}: {
  type: AssessmentType; totalItems: number; sections: AssessmentSection[];
  conceptItems: ConceptItemInfo[]; sectionNames: string[];
  onChange: (u: Partial<Pick<BuilderState, "type" | "totalItems" | "sections">>) => void;
  onNext: () => void; isLoading: boolean;
}) {
  const totalCovered = sections.reduce((s, sec) => s + (sec.to - sec.from + 1), 0);
  const gap = totalCovered < totalItems;
  const overflow = totalCovered > totalItems;

  // Validate each section has enough concept items, and check overlap/gaps
  const itemErrors: string[] = [];
  let expectedFrom = 1;
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const count = sec.to - sec.from + 1;
    if (sec.from !== expectedFrom) {
      itemErrors.push(`Section "${sec.title || defaultSectionTitle(sec.questionType)}" starts at ${sec.from} but expected ${expectedFrom}.`);
    }
    if (sec.to > totalItems) {
      itemErrors.push(`Section "${sec.title || defaultSectionTitle(sec.questionType)}" ends at ${sec.to} but total items is ${totalItems}.`);
    }
    if (sec.selectedItemIndices.length < count) {
      itemErrors.push(`"${sec.title || defaultSectionTitle(sec.questionType)}" needs ${count} items, but only ${sec.selectedItemIndices.length} selected.`);
    }
    expectedFrom = sec.to + 1;
  }

  const totalErr = totalItems > conceptItems.length
    ? `Total items (${totalItems}) exceeds available concept items (${conceptItems.length}).`
    : totalItems < 1 ? "Must be at least 1." : null;

  const valid = !totalErr && !overflow && !gap && itemErrors.length === 0;

  function recalcAll(arr: AssessmentSection[]): AssessmentSection[] {
    let cursor = 0;
    return arr.map((sec) => {
      const count = sec.to - sec.from + 1;
      const from = cursor + 1;
      const to = cursor + count;
      cursor = to;
      return { ...sec, from, to };
    });
  }

  function setSectionCount(idx: number, newCount: number) {
    const clamped = Math.max(1, newCount);
    let arr = sections.map((sec, i) => {
      if (i === idx) {
        const from = sec.from;
        const to = from + clamped - 1;
        const trimmed = sec.selectedItemIndices.slice(0, clamped);
        return { ...sec, from, to, selectedItemIndices: trimmed };
      }
      return sec;
    });
    // Recalc all boundaries from this point forward
    for (let i = idx + 1; i < arr.length; i++) {
      const prev = arr[i - 1];
      const prevCount = prev.to - prev.from + 1;
      const from = prev.from + prevCount;
      const curCount = arr[i].to - arr[i].from + 1;
      arr[i] = { ...arr[i], from, to: from + curCount - 1 };
    }
    onChange({ sections: arr });
  }

  function addSection() {
    const nextFrom = sections.length ? sections[sections.length - 1].to + 1 : 1;
    if (nextFrom > totalItems) return;
    const to = Math.min(nextFrom + 4, totalItems);
    onChange({ sections: [...sections, makeSection(nextFrom, to)] });
  }

  function updateSection(idx: number, u: Partial<AssessmentSection>) {
    onChange({ sections: sections.map((sec, i) => (i === idx ? { ...sec, ...u } : sec)) });
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
    <div className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Assessment Type <span className="text-destructive">*</span></label>
          <select value={type} onChange={(e) => onChange({ type: e.target.value as AssessmentType })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="quiz">Quiz</option><option value="activity">Activity</option><option value="exam">Exam</option><option value="custom">Custom</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total Items <span className="text-destructive">*</span></label>
          <input type="number" min={1} max={conceptItems.length} value={totalItems}
            onChange={(e) => onChange({ totalItems: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className={cn("w-full rounded-md border bg-background px-3 py-2 text-sm", totalErr && "border-destructive")} />
          {totalErr ? <p className="text-xs text-destructive">{totalErr}</p> : <p className="text-xs text-muted-foreground">Max {conceptItems.length} from concept build.</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Assessment Sections ({sections.length})</h3>
          <Button variant="outline" size="sm" onClick={addSection} disabled={totalCovered >= totalItems || totalItems === 0}>+ Add Section</Button>
        </div>

        {sections.length === 0 && (
          <p className="text-xs text-muted-foreground py-6 text-center border rounded-lg">No sections yet. Click "+ Add Section" to create one.</p>
        )}

        <div className="space-y-4">
          {sections.map((sec, si) => {
            const secCount = sec.to - sec.from + 1;
            const hasEnoughItems = sec.selectedItemIndices.length >= secCount;
            const selectedIndicesSet = new Set(sec.selectedItemIndices);

            return (
              <div key={sec.id} className="rounded-lg border p-4 space-y-3">

                <div className="flex items-center justify-between gap-3">
                  <input type="text" value={sec.title} placeholder={defaultSectionTitle(sec.questionType)}
                    onChange={(e) => updateSection(si, { title: e.target.value })}
                    className="flex-1 rounded border bg-background px-3 py-1.5 text-sm font-medium" />
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" disabled={si === 0} onClick={() => moveSection(si, si - 1)} className="disabled:opacity-20 hover:text-primary"><ChevronUp className="h-4 w-4" /></button>
                    <button type="button" disabled={si === sections.length - 1} onClick={() => moveSection(si, si + 1)} className="disabled:opacity-20 hover:text-primary"><ChevronDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removeSection(si)} className="text-xs text-destructive hover:underline">Remove</button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1 w-20">
                    <label className="text-xs text-muted-foreground">From (Items)</label>
                    <input type="number" value={sec.from} disabled className="w-full rounded-md border bg-muted/30 px-3 py-1.5 text-sm" />
                  </div>
                  <div className="space-y-1 w-20">
                    <label className="text-xs text-muted-foreground">Count</label>
                    <input type="number" min={1} max={totalItems - sec.from + 1} value={secCount}
                      onChange={(e) => setSectionCount(si, parseInt(e.target.value, 10) || 1)}
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
                  </div>
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select value={sec.questionType} onChange={(e) => updateSection(si, { questionType: e.target.value as QuestionType })} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                      {Q_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className={cn("text-xs", hasEnoughItems ? "text-green-600" : "text-destructive")}>{sec.selectedItemIndices.length} / {secCount} items</div>
                </div>

                <div className="rounded-lg border max-h-56 overflow-y-auto divide-y">
                  {grouped.map((g) => {
                    if (!g.items.length) return null;
                    const allSelected = g.items.every((ci) => selectedIndicesSet.has(ci.index));
                    return (
                      <div key={g.section} className="px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.section} ({g.items.length})</span>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input type="checkbox"
                              checked={allSelected}
                              onChange={() => {
                                if (allSelected) {
                                  updateSection(si, { selectedItemIndices: sec.selectedItemIndices.filter((idx) => !g.items.some((ci) => ci.index === idx)) });
                                } else {
                                  const toAdd = g.items.filter((ci) => !selectedIndicesSet.has(ci.index)).map((ci) => ci.index);
                                  updateSection(si, { selectedItemIndices: [...sec.selectedItemIndices, ...toAdd] });
                                }
                              }}
                              className="rounded" />
                            Select all
                          </label>
                        </div>
                        <div className="space-y-0.5">
                          {g.items.map((ci) => (
                            <label key={ci.index} className={cn("flex items-start gap-2 py-0.5 px-1 rounded cursor-pointer text-xs hover:bg-muted/30", selectedIndicesSet.has(ci.index) && "bg-primary/5")}>
                              <input type="checkbox" className="mt-0.5 rounded"
                                checked={selectedIndicesSet.has(ci.index)}
                                onChange={() => {
                                  updateSection(si, {
                                    selectedItemIndices: selectedIndicesSet.has(ci.index)
                                      ? sec.selectedItemIndices.filter((idx) => idx !== ci.index)
                                      : [...sec.selectedItemIndices, ci.index],
                                  });
                                }} />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{ci.name}</span>
                                {ci.definition && <span className="text-muted-foreground ml-1">— {ci.definition}</span>}
                              </div>
                              <span className={cn("text-[10px] uppercase shrink-0", ci.difficulty === "easy" ? "text-green-600" : ci.difficulty === "hard" ? "text-destructive" : "text-amber-600")}>{ci.difficulty}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!hasEnoughItems && (
                  <p className="text-xs text-destructive">Select at least {secCount} item{secCount > 1 ? "s" : ""} from the concept sections above.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {itemErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 space-y-1">
          {itemErrors.map((err, i) => <p key={i} className="text-xs text-destructive">{err}</p>)}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <p className={cn("text-sm", valid ? "text-green-600" : gap ? "text-amber-600" : overflow ? "text-destructive" : "text-amber-600")}>
          {totalCovered} / {totalItems} items covered
          {gap && " — add more sections"}
          {overflow && " — exceeds total"}
        </p>
        <Button onClick={onNext} disabled={!valid || isLoading} size="sm">
          {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Generate
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers to convert sections → ranges for API ─────────────────────────────
function sectionsToRanges(sections: AssessmentSection[]): RangeRow[] {
  return sections
    .filter((sec) => sec.selectedItemIndices.length > 0)
    .map((sec) => {
      // Get unique section names from selected concept items
      // (We don't have conceptItems here, so we keep a placeholder)
      return {
        from: sec.from,
        to: sec.to,
        questionType: sec.questionType,
        conceptSections: [] as string[], // filled by caller
      };
    });
}

interface RangeRow {
  from: number;
  to: number;
  questionType: QuestionType;
  conceptSections: string[];
}

function getSectionsForRanges(sections: AssessmentSection[], conceptItems: ConceptItemInfo[]): RangeRow[] {
  return sections
    .filter((sec) => sec.selectedItemIndices.length >= sec.to - sec.from + 1)
    .map((sec) => {
      const selectedConcepts = sec.selectedItemIndices.map((idx) => conceptItems[idx]).filter(Boolean);
      const uniqueSections = [...new Set(selectedConcepts.map((c) => c.section))];
      return {
        from: sec.from,
        to: sec.to,
        questionType: sec.questionType,
        conceptSections: uniqueSections,
      };
    });
}

// ─── Step 4: Generating ───────────────────────────────────────────────────────
function Step4({ classId, assessmentId, onQuestionsReady }: { classId: string; assessmentId: string; onQuestionsReady: (q: Question[]) => void }) {
  const advancedRef = useRef(false);
  const { data } = useAssessment(classId, assessmentId, {
    refetchInterval: (query) => (query.state.data?.questions?.length ?? 0) > 0 ? false : 3000,
  });
  const ready = (data?.questions?.length ?? 0) > 0;
  if (ready && !advancedRef.current) { advancedRef.current = true; setTimeout(() => onQuestionsReady(data!.questions), 300); }
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      {ready ? (
        <><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><Check className="h-6 w-6 text-green-600" /></div><p className="text-sm font-medium">Questions generated! Advancing...</p></>
      ) : (
        <><div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Loader2 className="h-6 w-6 text-muted-foreground animate-spin" /></div><p className="text-sm font-medium">Generating assessment questions...</p><p className="text-xs text-muted-foreground">Usually takes 10–30 seconds.</p></>
      )}
    </div>
  );
}

// ─── Step 5: Review Questions ─────────────────────────────────────────────────
function Step5({ classId, assessmentId, questions, onNext }: { classId: string; assessmentId: string; questions: Question[]; onNext: () => void }) {
  const [edits, setEdits] = useState<Record<string, { text: string; correctAnswer: string }>>(() => Object.fromEntries(questions.map((q) => [q.id, { text: q.text, correctAnswer: q.correctAnswer ?? "" }])));
  async function saveEdit(qId: string) {
    const e = edits[qId]; if (!e) return;
    try { await assessmentApi.updateQuestion(classId, assessmentId, qId, { questionText: e.text, correctAnswer: e.correctAnswer || undefined }); }
    catch { toast.error("Failed to save question edit."); }
  }
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-lg border bg-amber-50 border-amber-200 px-4 py-3 text-sm text-amber-800">You can edit questions before publishing. After release date, questions lock.</div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border p-4 space-y-3">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Item {i + 1} — {q.type.replace(/_/g, " ")}</span>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Question</label>
              <textarea value={edits[q.id]?.text ?? q.text} onChange={(e) => setEdits((p) => ({ ...p, [q.id]: { ...p[q.id], text: e.target.value } }))} onBlur={() => saveEdit(q.id)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
            </div>
            {q.choices && q.choices.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Choices</label>
                <div className="space-y-1">
                  {q.choices.map((c) => (
                    <div key={c.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded text-sm border", q.correctAnswer === c.text ? "border-green-300 bg-green-50" : "border-border")}>
                      <span className="font-mono text-xs font-bold w-5">{c.label}.</span>
                      <span>{c.text}</span>
                      {q.correctAnswer === c.text && <span className="text-xs text-green-600 ml-auto font-medium">Correct</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {q.type !== "essay" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Answer</label>
                <input type="text" value={edits[q.id]?.correctAnswer ?? ""} onChange={(e) => setEdits((p) => ({ ...p, [q.id]: { ...p[q.id], correctAnswer: e.target.value } }))} onBlur={() => saveEdit(q.id)} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
              </div>
            )}
          </div>
        ))}
      </div>
      <Button onClick={onNext} size="sm">Next</Button>
    </div>
  );
}

// ─── Step 6: Set Dates & Assign ───────────────────────────────────────────────
function Step6({ classId, releaseDate, endDate, selectedStudentIds, onChange, onPublish, isLoading }: {
  classId: string; releaseDate: string; endDate: string; selectedStudentIds: string[];
  onChange: (u: Partial<Pick<BuilderState, "releaseDate" | "endDate" | "selectedStudentIds">>) => void;
  onPublish: () => void; isLoading: boolean;
}) {
  const invalid = releaseDate && endDate && new Date(endDate) <= new Date(releaseDate);
  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: !!classId,
  });
  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Release Date</label>
        <input type="datetime-local" value={releaseDate} onChange={(e) => onChange({ releaseDate: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">End Date</label>
        <input type="datetime-local" value={endDate} onChange={(e) => onChange({ endDate: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        {invalid && <p className="text-xs text-destructive">End date must be after release date.</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Assign to Students</label>
        <p className="text-xs text-muted-foreground">Leave empty to assign to all enrolled students.</p>
        <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
          {students?.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No enrolled students.</p>}
          {students?.map((s) => (
            <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/30">
              <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={(e) => onChange({ selectedStudentIds: e.target.checked ? [...selectedStudentIds, s.id] : selectedStudentIds.filter((id) => id !== s.id) })} className="rounded" />
              <span>{s.fullName}</span>
              {s.email && <span className="text-xs text-muted-foreground ml-auto">{s.email}</span>}
            </label>
          ))}
        </div>
        {students && students.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => onChange({ selectedStudentIds: students.map((s) => s.id) })} className="text-xs text-primary hover:underline">Select all</button>
            <button type="button" onClick={() => onChange({ selectedStudentIds: [] })} className="text-xs text-muted-foreground hover:underline">Clear</button>
          </div>
        )}
      </div>
      <div className="pt-1 space-y-2">
        <Button onClick={onPublish} disabled={isLoading || !!invalid} size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Assessment
        </Button>
        <p className="text-xs text-muted-foreground">Leave dates blank to make it available immediately.</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>({
    selectedLesson: null, type: "quiz", totalItems: 1,
    sections: [], createdAssessmentId: null, generatedQuestions: [],
    releaseDate: "", endDate: "", selectedStudentIds: [],
  });

  const { mutateAsync: createAssessment, isPending: isCreating } = useCreateAssessment(classId);
  const { mutateAsync: updateAssessment, isPending: isUpdating } = useUpdateAssessment(classId);
  const { data: weeks } = useClassWeeks(classId);
  const patch = useCallback((u: Partial<BuilderState>) => setState((p) => ({ ...p, ...u })), []);
  const next = () => setStep((s) => s + 1);
  const concept = state.selectedLesson?.concept ?? null;
  const cc = getConceptContent(concept);

  function getTermId(): string {
    if (!state.selectedLesson || !weeks.length) return "";
    const week = weeks.find((w) => w.value === state.selectedLesson!.weekNumber);
    return week?.termId ?? "";
  }

  async function handleGenerate() {
    if (!state.selectedLesson) return;
    const termId = getTermId();
    if (!termId) { toast.error("Could not determine term for this lesson's week."); return; }
    const ranges = getSectionsForRanges(state.sections, cc.conceptItems);
    if (!ranges.length) { toast.error("No sections configured."); return; }
    try {
      const assessment = await createAssessment({
        lessonId: state.selectedLesson.id, termId, type: state.type,
        totalItems: state.totalItems,
        ranges: ranges.map((r) => ({ from: r.from, to: r.to, questionType: r.questionType as RangeConfig["questionType"], conceptSections: r.conceptSections })),
      });
      patch({ createdAssessmentId: assessment.id });
      next();
    } catch { toast.error("Failed to create assessment."); }
  }

  async function handlePublish() {
    if (!state.createdAssessmentId) return;
    try {
      await updateAssessment({ assessmentId: state.createdAssessmentId, data: { releaseDate: state.releaseDate || undefined, endDate: state.endDate || undefined } });
      if (state.selectedStudentIds.length > 0) {
        await assessmentApi.publish(classId, state.createdAssessmentId, { studentIds: state.selectedStudentIds });
      }
      toast.success("Assessment published!");
      router.push(`/educator/classes/${classId}/assessments/${state.createdAssessmentId}`);
    } catch { toast.error("Failed to publish."); }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/educator/classes/${classId}/assessments`} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-xl font-semibold">New Assessment</h1>
      </div>
      <StepIndicator current={step} />
      <div className="pt-2">
        {step === 0 && <Step1 classId={classId} selected={state.selectedLesson} onSelect={(l) => patch({ selectedLesson: l })} onNext={next} />}
        {step === 1 && <Step2 concept={concept} onNext={next} />}
        {step === 2 && <Step3 type={state.type} totalItems={state.totalItems} sections={state.sections} conceptItems={cc.conceptItems} sectionNames={cc.sections} onChange={(u) => patch(u)} onNext={handleGenerate} isLoading={isCreating} />}
        {step === 3 && state.createdAssessmentId && <Step4 classId={classId} assessmentId={state.createdAssessmentId} onQuestionsReady={(q) => { patch({ generatedQuestions: q }); next(); }} />}
        {step === 4 && state.createdAssessmentId && <Step5 classId={classId} assessmentId={state.createdAssessmentId} questions={state.generatedQuestions} onNext={next} />}
        {step === 5 && <Step6 classId={classId} releaseDate={state.releaseDate} endDate={state.endDate} selectedStudentIds={state.selectedStudentIds} onChange={(u) => patch(u)} onPublish={handlePublish} isLoading={isUpdating} />}
      </div>
    </div>
  );
}
