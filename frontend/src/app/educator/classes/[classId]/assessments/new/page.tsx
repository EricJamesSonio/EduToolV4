"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { assessmentKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";
import Link from "next/link";
import { Check, Loader2, ChevronDown, ChevronUp, Sparkles, Pencil, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLessons } from "@/hooks/educator/useLessons";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { useCreateAssessment,
  useAssessment,
  useUpdateAssessment,
} from "@/hooks/educator/useAssessments";
import { assessmentApi } from "@/api/educator/assessment.api";
import { educatorClassApi } from "@/api/educator/class.api";
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api";
import { gradeApi } from "@/api/educator/grade.api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { useQuery } from "@tanstack/react-query";
import type { Lesson, LessonConcept } from "@/types/educator/lesson.types";
import type { AssessmentType, QuestionType, Question, GradingMode } from "@/types/educator/assessment.types";
import type { RangeConfig, CreateAssessmentRequest } from "@/api/educator/assessment.api";

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
  manualQuestionText?: string; // educator-written question for manual sections
  manualMaxScore?: number; // max score for this manual section (1 block = N points)
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
  title: string;
  gradingMode: GradingMode;
  showBreakdown: boolean;
  manualMaxScore: number;
  totalItems: number;
  sections: AssessmentSection[];
  createdAssessmentId: string | null;
  previewId: string | null;
  generatedQuestions: Question[];
  manualInstructions: string;
  releaseDate: string;
  endDate: string;
  selectedStudentIds: string[];
  selectedTermId: string;
  weekNumber: number;
}

interface TermOption {
  termId: string;
  termName: string;
  semesterName: string;
}

const GRADING_MODE_LABELS: Record<string, string> = {
  system: "System-Graded",
  manual: "Manual-Graded",
};

const TYPE_LABELS: Record<string, string> = {
  written_work: "Written Work", performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment", exam: "Exam", quiz: "Quiz",
  assignment: "Assignment", project: "Project", recitation: "Recitation",
  participation: "Participation", behavior: "Behavior",
  attendance: "Attendance", activity: "Activity", custom: "Custom", other: "Other",
};

let secIdCounter = 0;
function makeSection(from: number, to: number, questionType?: QuestionType): AssessmentSection {
  const base: AssessmentSection = {
    id: `sec-${++secIdCounter}`,
    title: "",
    from,
    to,
    questionType: questionType ?? "multiple_choice",
    selectedItemIndices: [],
  };
  if (questionType === 'manual') {
    base.manualMaxScore = 1;
    base.manualQuestionText = '';
  }
  return base;
}

function defaultSectionTitle(type: QuestionType): string {
  const map: Record<string, string> = {
    multiple_choice: "Multiple Choice Questions",
    true_or_false: "True or False Questions",
    identification: "Identification Questions",
    enumeration: "Enumeration Questions",
    manual: "Manual Questions",
  };
  return map[type] ?? `${type.replace(/_/g, " ")} Questions`;
}

const CIRCLE_COLORS = [
  { fill: "bg-blue-500 text-white border-transparent", outline: "border-blue-500 text-blue-500 bg-card" },
  { fill: "bg-emerald-500 text-white border-transparent", outline: "border-emerald-500 text-emerald-500 bg-card" },
  { fill: "bg-purple-500 text-white border-transparent", outline: "border-purple-500 text-purple-500 bg-card" },
  { fill: "bg-amber-500 text-white border-transparent", outline: "border-amber-500 text-amber-500 bg-card" },
  { fill: "bg-teal-500 text-white border-transparent", outline: "border-teal-500 text-teal-500 bg-card" },
  { fill: "bg-indigo-500 text-white border-transparent", outline: "border-indigo-500 text-indigo-500 bg-card" },
  { fill: "bg-pink-500 text-white border-transparent", outline: "border-pink-500 text-pink-500 bg-card" },
  { fill: "bg-cyan-500 text-white border-transparent", outline: "border-cyan-500 text-cyan-500 bg-card" },
  { fill: "bg-orange-500 text-white border-transparent", outline: "border-orange-500 text-orange-500 bg-card" },
  { fill: "bg-rose-500 text-white border-transparent", outline: "border-rose-500 text-rose-500 bg-card" },
];

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const c = CIRCLE_COLORS[i % CIRCLE_COLORS.length];
        return (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-[3px] transition-colors",
                done && c.fill,
                active && c.outline,
                !done && !active && "border-muted-foreground/30 text-muted-foreground/40 bg-card",
              )}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-xs whitespace-nowrap", active ? "text-primary font-medium" : "text-muted-foreground/50")}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={cn("h-0.5 w-8 mx-1 mb-6 shrink-0", i < current ? "bg-primary" : "bg-muted")} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Grading Mode ─────────────────────────────────────────────────────
function Step0({ gradingMode, showBreakdown, onChange, onNext }: {
  gradingMode: GradingMode; showBreakdown: boolean;
  onChange: (u: Partial<BuilderState>) => void; onNext: () => void;
}) {
  const [selected, setSelected] = useState<GradingMode | null>(null);
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Choose how this assessment will be graded.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["system", "manual"] as const).map((mode, i) => {
          const isSelected = gradingMode === mode;
          return (
            <div key={mode} role="button" tabIndex={0}
              onClick={() => { setSelected(mode); onChange({ gradingMode: mode }); onNext(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(mode); onChange({ gradingMode: mode }); onNext(); } }}
              className={cn("relative rounded-xl border bg-card p-6 space-y-4 text-left transition-all duration-200 cursor-pointer select-none", isSelected ? "border-primary shadow-sm ring-1 ring-primary/20" : "hover:border-primary/40 hover:shadow-sm")}>
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <div className={cn("rounded-md p-2.5 w-fit", i === 0 ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600")}>
                {mode === "system" ? <Sparkles className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{GRADING_MODE_LABELS[mode]}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mode === "system"
                    ? "Questions are auto-generated from lesson concepts and auto-graded. Add Manual (Educator-Written) sections to include manually graded components — the system automatically treats it as hybrid."
                    : "Educator creates an assessment with free-form instructions. No auto-grading — scores are set manually. Best for projects, recitation, and behavior."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={showBreakdown} onChange={(e) => onChange({ showBreakdown: e.target.checked })} className="rounded" />
        Show breakdown to students
      </label>
      <Button onClick={onNext} size="sm">Next</Button>
    </div>
  );
}

// ─── Step 1: Select Lesson (system/hybrid) ────────────────────────────────────
function Step1({ classId, selected, onSelect, onNext }: { classId: string; selected: Lesson | null; onSelect: (l: Lesson) => void; onNext: () => void }) {
  const { data: lessons, isLoading } = useLessons(classId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading lessons...</p>;
  if (!lessons?.length) return <p className="text-sm text-muted-foreground">No lessons found. Create a lesson first.</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select a lesson with a completed concept build to generate questions from.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson, idx) => {
          const hasConcept = !!lesson.concept;
          return (
            <button key={lesson.id} disabled={!hasConcept} onClick={() => { onSelect(lesson); onNext(); }}
              className={cn("rounded-xl border bg-card p-6 space-y-4 text-left transition-all duration-200", selected?.id === lesson.id && "border-primary shadow-sm", hasConcept && selected?.id !== lesson.id && "hover:border-primary/40 hover:shadow-sm", !hasConcept && "opacity-40 cursor-not-allowed")}>
              <div className={cn("rounded-md p-2.5 w-fit", WEEK_COLORS[idx % WEEK_COLORS.length])}>
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">Week {lesson.weekNumber}{lesson.description ? ` — ${lesson.description}` : ""}</p>
              </div>
              <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full border", hasConcept ? "bg-green-50 text-green-700 border-green-200" : "bg-zinc-100 text-zinc-500 border-zinc-200")}>
                {hasConcept ? "Concept ready" : "No concept build"}
              </span>
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

function Step2({ concept, onNext }: { concept: LessonConcept | null; onNext: () => void }) {
  const cc = getConceptContent(concept);
  if (!cc.sections.length) return <p className="text-sm text-muted-foreground">No concept build available.</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Review concept sections used to generate questions.</p>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="divide-y">
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
    </div>
  );
}

// ─── Q_TYPES ──────────────────────────────────────────────────────────────────
const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_or_false", label: "True or False" },
  { value: "identification", label: "Identification" },
  { value: "enumeration", label: "Enumeration" },
  { value: "manual", label: "Manual (Educator-Written)" },
];

// ─── Step 3: Configuration (system/hybrid) ────────────────────────────────────
function Step3({
  type, title, totalItems, sections, conceptItems, sectionNames, schemeTypes, gradingMode, showBreakdown, manualMaxScore, onChange, onNext, isLoading,
}: {
  type: string; title: string; totalItems: number; sections: AssessmentSection[];
  conceptItems: ConceptItemInfo[]; sectionNames: string[];
  schemeTypes: string[];
  gradingMode: GradingMode; showBreakdown: boolean; manualMaxScore: number;
  onChange: (u: Partial<Pick<BuilderState, "type" | "title" | "totalItems" | "sections" | "gradingMode" | "showBreakdown" | "manualMaxScore">>) => void;
  onNext: () => void; isLoading: boolean;
}) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const aiItemCount = sections
    .filter((sec) => sec.questionType !== 'manual')
    .reduce((s, sec) => s + (sec.to - sec.from + 1), 0);
  const manualScoreTotal = sections
    .filter((sec) => sec.questionType === 'manual')
    .reduce((s, sec) => s + (sec.manualMaxScore ?? 1), 0);
  const hasManualSections = sections.some((sec) => sec.questionType === 'manual');
  const overallTotal = totalItems + manualScoreTotal;
  const totalCovered = aiItemCount;
  const gap = totalCovered < totalItems;
  const overflow = totalCovered > totalItems;

  const itemErrors: string[] = [];
  let expectedFrom = 1;
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (sec.questionType === 'manual') {
      if (!sec.manualQuestionText?.trim()) {
        itemErrors.push(`"${sec.title || defaultSectionTitle(sec.questionType)}" requires question text.`);
      }
      continue;
    }
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

  const aiItemErr = aiItemCount > conceptItems.length
    ? `AI sections total ${aiItemCount} items but concept build only has ${conceptItems.length}.`
    : null;
  const totalErr = totalItems < 1 ? "Must be at least 1." : null;

  const valid = !totalErr && !aiItemErr && !overflow && !gap && itemErrors.length === 0;

  function recalcAll(arr: AssessmentSection[]): AssessmentSection[] {
    let cursor = 0;
    return arr.map((sec) => {
      if (sec.questionType === 'manual') return { ...sec, from: 1, to: 1 };
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
    for (let i = idx + 1; i < arr.length; i++) {
      if (arr[i].questionType === 'manual') continue;
      const prevAI = [...arr.slice(0, i)].reverse().find((s) => s.questionType !== 'manual');
      const from = prevAI ? prevAI.to + 1 : 1;
      const curCount = arr[i].to - arr[i].from + 1;
      arr[i] = { ...arr[i], from, to: from + curCount - 1 };
    }
    onChange({ sections: arr });
  }

  function addSectionWithType(qType: QuestionType) {
    setShowTypePicker(false);
    if (qType === 'manual') {
      onChange({ sections: [...sections, makeSection(1, 1, 'manual')] });
    } else {
      const lastAI = [...sections].reverse().find((s) => s.questionType !== 'manual');
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
      // When switching to manual, reset range and set default max score
      if (u.questionType === 'manual' && sec.questionType !== 'manual') {
        next.from = 1;
        next.to = 1;
        next.manualMaxScore = next.manualMaxScore ?? 1;
        next.manualQuestionText = next.manualQuestionText ?? '';
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
          <label className="text-sm font-medium">Assessment Type <span className="text-destructive">*</span></label>
          <select value={type} onChange={(e) => onChange({ type: e.target.value as AssessmentType })} className="w-full rounded-md border bg-card px-3 py-2 text-sm">
            {schemeTypes.length > 0 ? schemeTypes.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            )) : (
              <>
                <option value="quiz">Quiz</option><option value="activity">Activity</option><option value="exam">Exam</option><option value="custom">Custom</option>
              </>
            )}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <input type="text" value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Quiz 2"
            className="w-full rounded-md border bg-card px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total Items <span className="text-destructive">*</span></label>
          <input type="number" min={1} value={totalItems}
            onChange={(e) => onChange({ totalItems: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className={cn("w-full rounded-md border bg-card px-3 py-2 text-sm", totalErr && "border-destructive")} />
          {totalErr ? <p className="text-xs text-destructive">{totalErr}</p> : <p className="text-xs text-muted-foreground">System-generated items count. Concept build limit ({conceptItems.length}) only applies to AI sections.</p>}
        </div>
      </div>
      </div>

      {hasManualSections && (
        <div className="rounded-lg border bg-blue-50/40 border-blue-200 px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Overall Total (AI + Manual):</span>
          <span className="font-semibold text-lg">{overallTotal}</span>
          <span className="text-xs text-muted-foreground">({aiItemCount} AI + {manualScoreTotal} Manual)</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between relative">
          <h3 className="text-sm font-semibold">Assessment Sections ({sections.length})</h3>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowTypePicker(!showTypePicker)}>+ Add Section</Button>
            {showTypePicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTypePicker(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border bg-popover p-1 shadow-lg">
                  {Q_TYPES.map((opt) => {
                    const isAi = opt.value !== 'manual';
                    const aiSlotsFull = aiItemCount >= totalItems;
                    const conceptFull = aiItemCount >= conceptItems.length;
                    const aiFull = isAi && (aiSlotsFull || conceptFull);
                    const aiReason = conceptFull ? "concept build full" : aiSlotsFull ? "all slots filled" : "";
                    return (
                      <button key={opt.value} type="button" disabled={aiFull}
                        onClick={() => !aiFull && addSectionWithType(opt.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                          aiFull ? "opacity-40 cursor-not-allowed text-muted-foreground" : "hover:bg-muted"
                        )}>
                        <span className="font-medium">{opt.label}</span>
                        {aiFull && <span className="text-[10px] text-muted-foreground ml-2">({aiReason})</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
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
              <div key={sec.id} className="rounded-lg border bg-card p-4 space-y-3">
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
                  {sec.questionType === 'manual' ? (
                    <div className="space-y-1 w-24">
                      <label className="text-xs text-muted-foreground">Max Score</label>
                      <input type="number" min={1} value={sec.manualMaxScore ?? 1}
                        onChange={(e) => updateSection(si, { manualMaxScore: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className="w-full rounded-md border bg-card px-3 py-1.5 text-sm" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 w-20">
                        <label className="text-xs text-muted-foreground">From (Items)</label>
                        <input type="number" value={sec.from} disabled className="w-full rounded-md border bg-muted/30 px-3 py-1.5 text-sm" />
                      </div>
                      <div className="space-y-1 w-20">
                        <label className="text-xs text-muted-foreground">Count</label>
                        <input type="number" min={1} max={totalItems - sec.from + 1} value={secCount}
                          onChange={(e) => setSectionCount(si, parseInt(e.target.value, 10) || 1)}
                          className="w-full rounded-md border bg-card px-3 py-1.5 text-sm" />
                      </div>
                    </>
                  )}
                  <div className="space-y-1 w-36">
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select value={sec.questionType} onChange={(e) => updateSection(si, { questionType: e.target.value as QuestionType })} className="w-full rounded-md border bg-card px-3 py-1.5 text-sm">
                      {Q_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {sec.questionType !== 'manual' && (
                    <div className={cn("text-xs", hasEnoughItems ? "text-green-600" : "text-destructive")}>{sec.selectedItemIndices.length} / {secCount} items</div>
                  )}
                </div>

                  {sec.questionType === 'manual' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Question / Prompt <span className="text-destructive">*</span></label>
                    <textarea value={sec.manualQuestionText ?? ''}
                      onChange={(e) => updateSection(si, { manualQuestionText: e.target.value })}
                      placeholder="Write the question or prompt students will respond to. This will be manually graded."
                      rows={4}
                      className="w-full rounded-md border bg-card px-3 py-2 text-sm resize-none" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {grouped.map((g, gi) => {
                        if (!g.items.length) return null;
                        const color = WEEK_COLORS[gi % WEEK_COLORS.length];
                        const allSelected = g.items.every((ci) => selectedIndicesSet.has(ci.index));
                        const someSelected = g.items.some((ci) => selectedIndicesSet.has(ci.index));
                        return (
                          <div key={g.section} className={cn("rounded-lg border bg-card p-4 space-y-3", someSelected && "ring-1 ring-primary/20")}>
                            <div className={cn("flex items-center justify-between -mx-4 -mt-4 mb-0 p-3 rounded-t-lg border-b", color)}>
                              <span className="text-sm font-semibold">{g.section}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium opacity-80">{g.items.length} items</span>
                                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                                  <input type="checkbox" checked={allSelected}
                                    onChange={() => {
                                      if (allSelected) {
                                        updateSection(si, { selectedItemIndices: sec.selectedItemIndices.filter((idx) => !g.items.some((ci) => ci.index === idx)) });
                                      } else {
                                        const toAdd = g.items.filter((ci) => !selectedIndicesSet.has(ci.index)).map((ci) => ci.index);
                                        updateSection(si, { selectedItemIndices: [...sec.selectedItemIndices, ...toAdd] });
                                      }
                                    }} className="rounded" />
                                  Select all
                                </label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {g.items.map((ci) => {
                                const isSelected = selectedIndicesSet.has(ci.index);
                                const diffColor = ci.difficulty === "easy" ? "bg-green-100 text-green-700 border-green-200" : ci.difficulty === "hard" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200";
                                return (
                                  <label key={ci.index} className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                    isSelected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-muted/20",
                                  )}>
                                    <input type="checkbox" className="mt-1 rounded"
                                      checked={isSelected}
                                      onChange={() => {
                                        updateSection(si, {
                                          selectedItemIndices: isSelected
                                            ? sec.selectedItemIndices.filter((idx) => idx !== ci.index)
                                            : [...sec.selectedItemIndices, ci.index],
                                        });
                                      }} />
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{ci.name}</span>
                                        <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border", diffColor)}>{ci.difficulty}</span>
                                      </div>
                                      {ci.definition && <p className="text-xs text-muted-foreground leading-relaxed">{ci.definition}</p>}
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!hasEnoughItems && (
                      <p className="text-xs text-destructive">Select at least {secCount} item{secCount > 1 ? "s" : ""} from the concept sections above.</p>
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
          {itemErrors.map((err, i) => <p key={i} className="text-xs text-destructive">{err}</p>)}
        </div>
      )}
      {aiItemErr && (
        <p className="text-xs text-destructive">{aiItemErr}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <p className={cn("text-sm", valid ? "text-green-600" : gap ? "text-amber-600" : overflow ? "text-destructive" : "text-amber-600")}>
          {totalCovered} / {totalItems} AI items covered
          {hasManualSections && <span className="text-muted-foreground ml-2">· Overall: {overallTotal}</span>}
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
interface RangeRow {
  from: number;
  to: number;
  questionType: QuestionType;
  conceptSections: string[];
  manualQuestionText?: string;
  manualMaxScore?: number;
}

function getSectionsForRanges(sections: AssessmentSection[], conceptItems: ConceptItemInfo[]): RangeRow[] {
  return sections
    .filter((sec) => sec.selectedItemIndices.length >= sec.to - sec.from + 1 || sec.questionType === 'manual')
    .map((sec) => {
      const selectedConcepts = sec.selectedItemIndices.map((idx) => conceptItems[idx]).filter(Boolean);
      const uniqueSections = [...new Set(selectedConcepts.map((c) => c.section))];
      return {
        from: sec.from,
        to: sec.to,
        questionType: sec.questionType,
        conceptSections: uniqueSections,
        manualQuestionText: sec.questionType === 'manual' ? sec.manualQuestionText : undefined,
        manualMaxScore: sec.questionType === 'manual' ? sec.manualMaxScore : undefined,
      };
    });
}

// ─── Step 4: Generating Preview (system/hybrid) ─────────────────────────────
function Step4({ classId, previewId, onQuestionsReady }: { classId: string; previewId: string; onQuestionsReady: (q: Question[]) => void }) {
  const advancedRef = useRef(false);
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const { data: preview } = useQuery({
    queryKey: ["preview", previewId],
    queryFn: () => assessmentApi.getPreview(classId, previewId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "completed" || s === "failed" ? false : 1500;
    },
    enabled: !!previewId && !advancedRef.current && !cancelling,
    retry: false,
  });

  const ready = preview?.status === "completed" && !!preview?.questions?.length;
  if (ready && !advancedRef.current) {
    advancedRef.current = true;
    setTimeout(() => {
      const mapped = preview!.questions!.map((q: any, i: number) => ({
        id: `preview-${i}`, assessmentId: previewId,
        order: q.number ?? i + 1,
        type: q.type as Question["type"],
        text: q.question,
        choices: Array.isArray(q.choices)
          ? q.choices.slice(0, 4).map((t: string, j: number) => ({ label: ["A", "B", "C", "D"][j] as "A"|"B"|"C"|"D", text: t }))
          : null,
        correctAnswer: q.answer ?? q.correct_answer ?? null,
        points: 1, isLocked: false,
        isManual: q.type === 'manual',
      }));
      onQuestionsReady(mapped);
    }, 300);
  }

  const failed = preview?.status === "failed" && !ready;

  async function handleCancel() {
    setCancelling(true);
    try { await assessmentApi.cancelPreview(classId, previewId); } catch {}
    router.back();
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-md mx-auto text-center">
      {ready ? (
        <>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium">Questions generated! Advancing...</p>
        </>
      ) : failed ? (
        <>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <p className="text-sm font-medium text-red-600">Generation failed</p>
          <p className="text-xs text-muted-foreground">{preview?.message ?? "Unknown error"}</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>Go back and try again</Button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
          <p className="text-sm font-medium">Generating assessment questions...</p>
          {preview?.chunksTotal ? (
            <>
              <p className="text-xs text-muted-foreground">{preview.message}</p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${(preview.chunksDone / preview.chunksTotal) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{preview.chunksDone}/{preview.chunksTotal} chunks</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{preview?.message ?? "Starting generation..."}</p>
          )}
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="mt-4">
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Cancel
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Step 5: Final Review — full-page assessment summary ─────────────────────
function Step5({
  classId, previewId, questions, state, conceptItems, sectionNames, termInfo, onNext
}: {
  classId: string; previewId: string; questions: Question[];
  state: BuilderState; conceptItems: ConceptItemInfo[]; sectionNames: string[];
  termInfo: { termId: string; termName: string; semesterName: string } | null;
  onNext: () => void;
}) {
  const [edits, setEdits] = useState<Record<string, { text: string; correctAnswer: string }>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, { text: q.text, correctAnswer: q.correctAnswer ?? "" }]))
  );

  // Group questions by section
  let qCursor = 0;
  const groups = state.sections.map((sec, si) => {
    if (sec.questionType === 'manual') {
      const q = questions.find((qq) => qq.isManual);
      if (q) qCursor++;
      return { section: sec, questions: q ? [q] : [] };
    }
    const count = sec.to - sec.from + 1;
    const secQs = questions.slice(qCursor, qCursor + count).filter((qq) => !qq.isManual);
    qCursor += count;
    return { section: sec, questions: secQs };
  });

  const aiSections = state.sections.filter((s) => s.questionType !== 'manual');
  const manualSections = state.sections.filter((s) => s.questionType === 'manual');
  const aiItemCount = aiSections.reduce((s, sec) => s + (sec.to - sec.from + 1), 0);
  const manualScoreTotal = manualSections.reduce((s, sec) => s + (sec.manualMaxScore ?? 1), 0);

  return (
    <div className="space-y-6">
      {/* ── Assessment Summary Card ── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          Assessment Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
            <p className="text-sm font-medium mt-0.5">{TYPE_LABELS[state.type] ?? state.type}</p>
          </div>
          {state.title && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Title</p>
              <p className="text-sm font-medium mt-0.5">{state.title}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Grading Mode</p>
            <p className="text-sm font-medium mt-0.5 capitalize">{state.gradingMode === 'hybrid' ? 'Hybrid' : state.gradingMode === 'system' ? 'System-Graded' : 'Manual-Graded'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Items</p>
            <p className="text-sm font-medium mt-0.5">{state.totalItems}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Breakdown Visible</p>
            <p className="text-sm font-medium mt-0.5">{state.showBreakdown ? "Yes" : "No"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{aiItemCount}</strong> AI-generated items</span>
          <span><strong className="text-foreground">{manualScoreTotal}</strong> manual max score</span>
          <span><strong className="text-foreground">{conceptItems.length}</strong> concept build items available</span>
          {state.selectedLesson && <span>Lesson: {state.selectedLesson.title}</span>}
          <span>{sectionNames.length} concept section{sectionNames.length !== 1 ? "s" : ""}</span>
          {termInfo && <span>Term: <strong>{termInfo.termName}</strong> ({termInfo.semesterName})</span>}
        </div>
        {questions.length > 0 && (
          <div className="pt-2 border-t flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            {questions.filter((q) => q.isManual).length > 0 && (
              <span className="text-amber-600">{questions.filter((q) => q.isManual).length} manually graded</span>
            )}
            <span className="text-green-600">{questions.filter((q) => !q.isManual).length} auto-graded</span>
          </div>
        )}
      </div>

      {/* ── Sections Overview ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sections</h3>
        <div className="space-y-2">
          {state.sections.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">No sections configured.</p>
          )}
          {state.sections.map((sec, si) => {
            const group = groups[si];
            const secQs = group?.questions ?? [];

            if (sec.questionType === 'manual') {
              return (
                <div key={sec.id} className="rounded-lg border bg-amber-50/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section {si + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-100 text-amber-700">Manual (Educator-Written)</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Max Score: <strong>{sec.manualMaxScore ?? 1}</strong></span>
                    </div>
                  </div>
                  {sec.manualQuestionText && (
                    <p className="text-sm bg-white rounded border px-3 py-2 italic text-muted-foreground">
                      &ldquo;{sec.manualQuestionText}&rdquo;
                    </p>
                  )}
                  {secQs.length > 0 && (
                    <QuestionCard question={secQs[0]} index={-1} edits={edits} />
                  )}
                </div>
              );
            }

            const count = sec.to - sec.from + 1;
            const selectedConceptNames = [...new Set(
              sec.selectedItemIndices.map((idx) => conceptItems[idx]?.section).filter(Boolean)
            )];

            return (
              <div key={sec.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section {si + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">{sec.questionType.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Items <strong>{sec.from}–{sec.to}</strong></span>
                    <span>Count: <strong>{count}</strong></span>
                    {secQs.length > 0 && (
                      <span>{secQs.length} question{secQs.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
                {selectedConceptNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConceptNames.map((name) => (
                      <span key={name} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{name}</span>
                    ))}
                  </div>
                )}
                <div className="space-y-2 pt-2 border-t">
                  {secQs.map((q, qi) => (
                    <QuestionCard key={q.id} question={q} index={qi + 1} edits={edits} />
                  ))}
                  {secQs.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No questions generated for this section.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Continue Button ── */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <Button onClick={onNext} disabled={questions.length === 0} size="default">
          Continue to Dates
        </Button>
        {questions.length === 0 && <p className="text-xs text-destructive">No questions to review.</p>}
        <p className="text-xs text-muted-foreground">Dates and student assignment will be set in the next step.</p>
      </div>
    </div>
  );
}

// ─── Inline question card for Step5 ──────────────────────────────────────────
function QuestionCard({
  question, index, edits,
}: {
  question: Question; index: number;
  edits: Record<string, { text: string; correctAnswer: string }>;
}) {
  const isManualQ = question.type === 'manual' || (question as any).isManual;
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {index > 0 && <>Item {index}</>}
          {isManualQ && <span className="ml-2 text-amber-600">(Manually graded)</span>}
        </span>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Question</label>
        <p className="text-sm bg-muted/30 rounded border px-3 py-2">{question.text}</p>
      </div>
      {question.choices && question.choices.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Choices</label>
          <div className="space-y-1">
            {question.choices.map((c) => (
              <div key={c.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded text-sm border", question.correctAnswer === c.text ? "border-green-300 bg-green-50" : "border-border")}>
                <span className="font-mono text-xs font-bold w-5">{c.label}.</span><span>{c.text}</span>
                {question.correctAnswer === c.text && <span className="text-xs text-green-600 ml-auto font-medium">Correct</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!isManualQ && question.type !== "essay" && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Answer</label>
          <p className="text-sm bg-muted/30 rounded border px-3 py-2">{question.correctAnswer ?? "(not set)"}</p>
        </div>
      )}
    </div>
  );
}

// ─── ManualStep1: Type + Instructions (manual mode) ────────────────────────────
function ManualStep1({ type, title, manualInstructions, schemeTypes, onChange, onNext }: {
  type: string; title: string; manualInstructions: string; schemeTypes: string[];
  onChange: (u: Partial<BuilderState>) => void; onNext: () => void;
}) {
  const valid = !!type && !!manualInstructions.trim();
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Assessment Type <span className="text-destructive">*</span></label>
            <select value={type} onChange={(e) => onChange({ type: e.target.value as AssessmentType })}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm">
              <option value="">Select type...</option>
              {schemeTypes.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] ?? t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input type="text" value={title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Quiz 2"
              className="w-full rounded-md border bg-card px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Instructions <span className="text-destructive">*</span></label>
          <p className="text-xs text-muted-foreground">Describe the task, project, or criteria for this manual assessment.</p>
          <textarea value={manualInstructions}
            onChange={(e) => onChange({ manualInstructions: e.target.value })}
            placeholder={`e.g., "This is the score based on your behavior as a student."\n\ne.g., "Create a website and submit the GitHub link."`}
            rows={8}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm resize-none" />
        </div>
      </div>

      <Button onClick={onNext} disabled={!valid} size="sm">Next</Button>
    </div>
  );
}

// ─── ManualStep2: Items + Dates + Assign (manual mode) ────────────────────────
function ManualStep2({ classId, totalItems, weekNumber, releaseDate, endDate, selectedStudentIds, selectedTermId, onChange, onCreate, isLoading }: {
  classId: string; totalItems: number; weekNumber: number; releaseDate: string; endDate: string; selectedStudentIds: string[];
  selectedTermId: string;
  onChange: (u: Partial<BuilderState>) => void; onCreate: () => void; isLoading: boolean;
}) {
  const invalid = !releaseDate || !endDate || new Date(endDate) <= new Date(releaseDate);
  const { data: weeks = [] } = useClassWeeks(classId);
  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: !!classId,
  });

  // Build term/week groups from weeks data
  const termMap = new Map<string, { label: string; weeks: { value: number; label: string }[] }>();
  for (const w of weeks) {
    if (!termMap.has(w.termId)) termMap.set(w.termId, { label: w.termName, weeks: [] });
    termMap.get(w.termId)!.weeks.push({ value: w.value, label: w.label });
  }

  const termOptions = Array.from(termMap.entries()).map(([id, v]) => ({ id, ...v }));

  const selectedWeek = weeks.find((w) => w.value === weekNumber && w.termId === selectedTermId);
  const filteredWeeks = selectedTermId ? (termMap.get(selectedTermId)?.weeks ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total Items / Max Score <span className="text-destructive">*</span></label>
          <input type="number" min={1} value={totalItems}
            onChange={(e) => onChange({ totalItems: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className="w-24 rounded-md border bg-card px-3 py-2 text-sm" />
          <p className="text-xs text-muted-foreground">Maximum possible score for this manual assessment.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Term <span className="text-destructive">*</span></label>
            <select value={selectedTermId} onChange={(e) => { onChange({ selectedTermId: e.target.value, weekNumber: 0 }); }}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm">
              <option value="">Select term...</option>
              {termOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Week <span className="text-destructive">*</span></label>
            <select value={selectedTermId && weekNumber ? `${weekNumber}` : ""} onChange={(e) => {
              const wn = parseInt(e.target.value, 10);
              const w = weeks.find((x) => x.value === wn && x.termId === selectedTermId);
              if (w) onChange({ weekNumber: wn, selectedTermId: w.termId });
            }}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm">
              <option value="">Select week...</option>
              {filteredWeeks.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedWeek && (
          <p className="text-xs text-muted-foreground">
            Registered in: <strong>{selectedWeek.semesterName}</strong> — <strong>{selectedWeek.termName}</strong> — <strong>{selectedWeek.label}</strong>
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Release Date <span className="text-destructive">*</span></label>
            <input type="datetime-local" value={releaseDate} onChange={(e) => onChange({ releaseDate: e.target.value })} className="w-full rounded-md border bg-card px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End Date <span className="text-destructive">*</span></label>
            <input type="datetime-local" value={endDate} onChange={(e) => onChange({ endDate: e.target.value })} className="w-full rounded-md border bg-card px-3 py-2 text-sm" />
            {invalid && <p className="text-xs text-destructive">End date must be after release date.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
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
      </div>

      <div className="pt-1 space-y-2">
        <Button onClick={onCreate} disabled={isLoading || !!invalid} size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Manual Assessment
        </Button>
        {(!releaseDate || !endDate) && <p className="text-xs text-destructive">Release date and end date are required.</p>}
        {releaseDate && endDate && invalid && <p className="text-xs text-destructive">End date must be after release date.</p>}
      </div>
    </div>
  );
}

// ─── Step6: Set Dates & Assign (system/hybrid) ───────────────────────────────
function Step6({ classId, releaseDate, endDate, selectedStudentIds, termInfo, onChange, onPublish, isLoading }: {
  classId: string; releaseDate: string; endDate: string; selectedStudentIds: string[];
  termInfo: { termName: string; semesterName: string } | null;
  onChange: (u: Partial<Pick<BuilderState, "releaseDate" | "endDate" | "selectedStudentIds">>) => void;
  onPublish: () => void; isLoading: boolean;
}) {
  const datesMissing = !releaseDate || !endDate;
  const invalid = datesMissing || new Date(endDate) <= new Date(releaseDate);
  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: !!classId,
  });
  return (
    <div className="space-y-6">
      {termInfo && (
        <div className="rounded-xl border bg-card p-6 text-sm">
          <span className="text-muted-foreground">Assessment will be registered in: </span>
          <span className="font-semibold">{termInfo.termName} ({termInfo.semesterName})</span>
        </div>
      )}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Release Date <span className="text-destructive">*</span></label>
            <input type="datetime-local" value={releaseDate} onChange={(e) => onChange({ releaseDate: e.target.value })} className="w-full rounded-md border bg-card px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End Date <span className="text-destructive">*</span></label>
            <input type="datetime-local" value={endDate} onChange={(e) => onChange({ endDate: e.target.value })} className="w-full rounded-md border bg-card px-3 py-2 text-sm" />
            {invalid && <p className="text-xs text-destructive">End date must be after release date.</p>}
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
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
      </div>
      <div className="pt-1 space-y-2">
        <Button onClick={onPublish} disabled={isLoading || !!invalid} size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Assessment
        </Button>
        <p className="text-xs text-destructive">Release date and end date are required.</p>
        {!datesMissing && invalid && <p className="text-xs text-destructive">End date must be after release date.</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const classId = params.classId as string;

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>({
    selectedLesson: null, type: "quiz", title: "Quiz", gradingMode: "system", showBreakdown: false, manualMaxScore: 0,
    totalItems: 1, sections: [], createdAssessmentId: null, previewId: null, generatedQuestions: [],
    manualInstructions: "", releaseDate: "", endDate: "", selectedStudentIds: [], selectedTermId: "", weekNumber: 0,
  });

  const { mutateAsync: updateAssessment, isPending: isUpdating } = useUpdateAssessment(classId);
  const { data: weeks } = useClassWeeks(classId);
  const { data: gradingScheme } = useQuery({
    queryKey: ["grading-scheme", classId],
    queryFn: () => educatorGradingSchemeApi.getForClass(classId),
  });
  const schemeTypes = gradingScheme?.components
    ?.map((c) => c.type) ?? [];
  const patch = useCallback((u: Partial<BuilderState>) => setState((p) => ({ ...p, ...u })), []);
  const next = () => setStep((s) => s + 1);

  useEffect(() => {
    if (schemeTypes.length > 0) {
      setState((prev) => {
        if (schemeTypes.includes(prev.type)) return prev;
        const first = schemeTypes[0];
        const label = TYPE_LABELS[first] ?? first.charAt(0).toUpperCase() + first.slice(1);
        return { ...prev, type: first, title: label };
      });
    }
  }, [schemeTypes]);

  const prevTypeRef = useRef(state.type);
  useEffect(() => {
    if (state.type !== prevTypeRef.current) {
      const oldType = prevTypeRef.current;
      prevTypeRef.current = state.type;
      const oldDefault = TYPE_LABELS[oldType] ?? oldType.charAt(0).toUpperCase() + oldType.slice(1);
      const newDefault = TYPE_LABELS[state.type] ?? state.type.charAt(0).toUpperCase() + state.type.slice(1);
      if (!state.title || state.title === oldDefault) {
        patch({ title: newDefault });
      }
    }
  }, [state.type]);
  const prev = () => setStep((s) => s - 1);
  const concept = state.selectedLesson?.concept ?? null;
  const cc = getConceptContent(concept);

  const isManual = state.gradingMode === "manual";
  const isSystem = state.gradingMode === "system" || state.gradingMode === "hybrid";

  const systemSteps = ["Select Lesson", "View Concepts", "Configuration", "Generate", "Review Questions", "Set Dates & Assign"];
  const manualSteps = ["Type & Instructions", "Items & Dates"];
  const allSteps = ["Grading Mode", ...(isManual ? manualSteps : systemSteps)];

  const { data: termOptions = [] } = useQuery({
    queryKey: ["grade-term-options", classId],
    queryFn: () => gradeApi.getTermOptions(classId),
    enabled: !!classId,
  });

  function getLessonTermInfo(): { termId: string; termName: string; semesterName: string } | null {
    if (!state.selectedLesson || !weeks.length) return null;
    const week = weeks.find((w) => w.value === state.selectedLesson!.weekNumber);
    if (!week) return null;
    return { termId: week.termId, termName: week.termName, semesterName: week.semesterName };
  }

  function getTermId(): string {
    return getLessonTermInfo()?.termId ?? "";
  }

  // Auto-set a default term for manual mode when entering step 2
  useEffect(() => {
    if (isManual && step === 2 && !state.selectedTermId && termOptions.length > 0) {
      patch({ selectedTermId: termOptions[0].termId });
    }
  }, [isManual, step, state.selectedTermId, termOptions.length]);

  async function handleGenerate() {
    if (!state.selectedLesson) return;
    const termId = getTermId();
    if (!termId) { toast.error("Could not determine term for this lesson's week."); return; }
    const ranges = getSectionsForRanges(state.sections, cc.conceptItems);
    if (!ranges.length) { toast.error("No sections configured."); return; }

    // Auto-detect hybrid: if system mode has manual sections, treat as hybrid
    const hasManualSections = ranges.some((r) => r.questionType === 'manual');
    const effectiveGradingMode = state.gradingMode === 'system' && hasManualSections ? 'hybrid' : state.gradingMode;

    // Derive manualMaxScore from section-level values
    const manualScoreTotal = ranges
      .filter((r) => r.questionType === 'manual')
      .reduce((sum, r) => sum + (r.manualMaxScore ?? 1), 0);
    const derivedManualMaxScore = effectiveGradingMode === 'hybrid' ? manualScoreTotal : undefined;

    try {
      // Send combined total (AI + manual) to API for scoring denominator
      const combinedTotal = hasManualSections ? state.totalItems + manualScoreTotal : state.totalItems;
      const { previewId } = await assessmentApi.generatePreview(classId, {
        lessonId: state.selectedLesson.id, termId, type: state.type,
        title: state.title || undefined,
        totalItems: combinedTotal,
        gradingMode: effectiveGradingMode as GradingMode,
        showBreakdown: state.showBreakdown,
        manualMaxScore: derivedManualMaxScore,
        ranges: ranges.map((r) => ({ from: r.from, to: r.to, questionType: r.questionType as RangeConfig["questionType"], conceptSections: r.conceptSections, manualQuestionText: r.manualQuestionText, manualMaxScore: r.manualMaxScore })),
      });
      patch({ previewId, gradingMode: effectiveGradingMode as GradingMode });
      next();
    } catch { toast.error("Failed to start question generation."); }
  }

  async function handlePublish() {
    if (!state.previewId) return;
    try {
      const assessment = await assessmentApi.confirmPreview(classId, state.previewId);
      const assessmentId = assessment.id;
      queryClient.setQueryData(assessmentKeys.detail(assessmentId), assessment);
      await updateAssessment({ assessmentId, data: { releaseDate: state.releaseDate, endDate: state.endDate, showBreakdown: state.showBreakdown, weekNumber: state.weekNumber || undefined } });
      const published = await assessmentApi.publish(classId, assessmentId, state.selectedStudentIds.length > 0 ? { studentIds: state.selectedStudentIds } : undefined);
      if (published) queryClient.setQueryData(assessmentKeys.detail(assessmentId), (old: any) => old ? { ...old, isPublished: true } : old);
      toast.success("Assessment published!");
      router.push(`/educator/classes/${classId}/assessments/${assessmentId}`);
    } catch { toast.error("Failed to publish."); }
  }

  async function handleCreateManual() {
    const termId = state.selectedTermId;
    if (!termId) { toast.error("Please select a term."); return; }
    if (!state.weekNumber) { toast.error("Please select a week."); return; }
    try {
      const assessment = await assessmentApi.create(classId, {
        termId, type: state.type,
        title: state.title || undefined,
        totalItems: state.totalItems,
        gradingMode: "manual",
        showBreakdown: state.showBreakdown,
        manualInstructions: state.manualInstructions,
        releaseDate: state.releaseDate || undefined,
        endDate: state.endDate || undefined,
        weekNumber: state.weekNumber,
        ranges: [],
      });
      queryClient.setQueryData(assessmentKeys.detail(assessment.id), assessment);
      toast.success("Manual assessment created!");
      router.push(`/educator/classes/${classId}/assessments/${assessment.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create assessment.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Assessment"
        breadcrumbs={[{ label: "Assessments", href: `/educator/classes/${classId}/assessments` }]}
      />
      <StepIndicator steps={allSteps} current={step} />
      <div className="pt-2">
        {step === 0 && (
          <Step0 gradingMode={state.gradingMode} showBreakdown={state.showBreakdown}
            onChange={(u) => patch(u)} onNext={() => { if (state.gradingMode) next(); else toast.error("Please select a grading mode."); }} />
        )}

        {isSystem && step === 1 && (
          <div className="space-y-6">
            <Step1 classId={classId} selected={state.selectedLesson} onSelect={(l) => patch({ selectedLesson: l, weekNumber: l.weekNumber })} onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to grading mode</Button>
          </div>
        )}
        {isSystem && step === 2 && (
          <div className="space-y-6">
            <Step2 concept={concept} onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to lesson selection</Button>
          </div>
        )}
        {isSystem && step === 3 && (
          <div className="space-y-6">
            <Step3 type={state.type} title={state.title} totalItems={state.totalItems} sections={state.sections}
              conceptItems={cc.conceptItems} sectionNames={cc.sections} schemeTypes={schemeTypes}
              gradingMode={state.gradingMode} showBreakdown={state.showBreakdown} manualMaxScore={state.manualMaxScore}
              onChange={(u) => patch(u)} onNext={handleGenerate} isLoading={false} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to concepts</Button>
          </div>
        )}
        {isSystem && step === 4 && state.previewId && <Step4 classId={classId} previewId={state.previewId} onQuestionsReady={(q) => { patch({ generatedQuestions: q }); next(); }} />}
        {isSystem && step === 5 && state.previewId && (
          <div className="space-y-6">
            <Step5 classId={classId} previewId={state.previewId} questions={state.generatedQuestions}
              state={state} conceptItems={cc.conceptItems} sectionNames={cc.sections}
              termInfo={getLessonTermInfo()}
              onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to generation</Button>
          </div>
        )}
        {isSystem && step === 6 && (
          <div className="space-y-6">
            <Step6 classId={classId} releaseDate={state.releaseDate} endDate={state.endDate} selectedStudentIds={state.selectedStudentIds} termInfo={getLessonTermInfo()} onChange={(u) => patch(u)} onPublish={handlePublish} isLoading={isUpdating} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to question review</Button>
          </div>
        )}

        {isManual && step === 1 && (
          <div className="space-y-6">
            <ManualStep1 type={state.type} title={state.title} manualInstructions={state.manualInstructions} schemeTypes={schemeTypes} onChange={(u) => patch(u)} onNext={next} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to grading mode</Button>
          </div>
        )}
        {isManual && step === 2 && (
          <div className="space-y-6">
            <ManualStep2 classId={classId} totalItems={state.totalItems} weekNumber={state.weekNumber}
              releaseDate={state.releaseDate} endDate={state.endDate}
              selectedStudentIds={state.selectedStudentIds}
              selectedTermId={state.selectedTermId}
              onChange={(u) => patch(u)} onCreate={handleCreateManual} isLoading={isUpdating} />
            <Button variant="ghost" size="sm" onClick={prev} className="text-xs">← Back to instructions</Button>
          </div>
        )}
      </div>
    </div>
  );
}
