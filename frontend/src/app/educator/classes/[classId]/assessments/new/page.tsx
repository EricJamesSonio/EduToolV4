"use client";

// filepath: frontend/src/app/educator/classes/[classId]/assessments/new/page.tsx

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
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
import type { Lesson, LessonConcept, ConceptSection } from "@/types/educator/lesson.types";
import type { AssessmentType, QuestionType, Question } from "@/types/educator/assessment.types";
import type { CreateAssessmentRequest, RangeConfig } from "@/api/educator/assessment.api";

interface RangeRow {
  from: number;
  to: number;
  questionType: QuestionType;
  conceptSections: string[];
}

interface BuilderState {
  selectedLesson: Lesson | null;
  type: AssessmentType;
  totalItems: number;
  ranges: RangeRow[];
  createdAssessmentId: string | null;
  generatedQuestions: Question[];
  releaseDate: string;
  endDate: string;
  selectedStudentIds: string[];
}

const STEPS = ["Select Lesson", "View Concepts", "Basic Config", "Item Ranges", "Generate", "Review Questions", "Set Dates & Assign"];

function StepIndicator({ current }: { current: number }): React.JSX.Element {
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

function Step1({ classId, selected, onSelect, onNext }: { classId: string; selected: Lesson | null; onSelect: (l: Lesson) => void; onNext: () => void }): React.JSX.Element {
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

interface ConceptContent {
  sections?: string[];
  keywords?: string[];
  questionCapacity?: Record<string, number>;
}

function getConceptContent(concept: LessonConcept | null): ConceptContent {
  if (!concept?.content) return {};
  const raw = concept.content as any;
  return {
    sections: Array.isArray(raw.sections) ? raw.sections : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    questionCapacity: raw.questionCapacity ?? {},
  };
}

function getConceptSections(concept: LessonConcept | null): ConceptSection[] {
  const c = getConceptContent(concept);
  const capacity = c.questionCapacity ?? {};
  return (c.sections ?? []).map((name, i) => ({
    id: `sec-${i}`,
    name,
    keywordCount: capacity[name] ?? 0,
  }));
}

function getTotalItems(concept: LessonConcept | null): number {
  const c = getConceptContent(concept);
  return Object.values(c.questionCapacity ?? {}).reduce((sum, v) => sum + v, 0);
}

function Step2({ concept, onNext }: { concept: LessonConcept | null; onNext: () => void }): React.JSX.Element {
  const c = getConceptContent(concept);
  if (!c.sections?.length) return <p className="text-sm text-muted-foreground">No concept build available.</p>;
  const sections = c.sections;
  const capacity = c.questionCapacity ?? {};
  const totalItems = getTotalItems(concept);
  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-muted-foreground">Review concept sections used to generate questions.</p>
      <div className="rounded-lg border divide-y">
        {sections.map((name, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">cap: {capacity[name] ?? 0}</span>
          </div>
        ))}
        <div className="px-4 py-3 flex items-center justify-between bg-muted/20">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-semibold">{totalItems} items</span>
        </div>
      </div>
      <Button onClick={onNext} size="sm">Next</Button>
    </div>
  );
}

function Step3({ type, totalItems, maxItems, onChange, onNext }: { type: AssessmentType; totalItems: number; maxItems: number; onChange: (u: Partial<Pick<BuilderState, "type" | "totalItems">>) => void; onNext: () => void }): React.JSX.Element {
  const err = totalItems > maxItems ? `Cannot exceed ${maxItems} items.` : totalItems < 1 ? "Must be at least 1." : null;
  return (
    <div className="space-y-5 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Type <span className="text-destructive">*</span></label>
        <select value={type} onChange={(e) => onChange({ type: e.target.value as AssessmentType })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
          <option value="quiz">Quiz</option><option value="activity">Activity</option><option value="exam">Exam</option><option value="custom">Custom</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Total Items <span className="text-destructive">*</span></label>
        <input type="number" min={1} max={maxItems} value={totalItems} onChange={(e) => onChange({ totalItems: parseInt(e.target.value, 10) || 1 })} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        {err ? <p className="text-xs text-destructive">{err}</p> : <p className="text-xs text-muted-foreground">Max {maxItems} from concept build.</p>}
      </div>
      <Button onClick={onNext} disabled={!!err} size="sm">Next</Button>
    </div>
  );
}

const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" }, { value: "true_or_false", label: "True or False" },
  { value: "identification", label: "Identification" }, { value: "enumeration", label: "Enumeration" }, { value: "essay", label: "Essay" },
];

function Step4({ ranges, totalItems, sections, onChange, onNext, isLoading }: { ranges: RangeRow[]; totalItems: number; sections: ConceptSection[]; onChange: (r: RangeRow[]) => void; onNext: () => void; isLoading: boolean }): React.JSX.Element {
  const covered = ranges.reduce((s, r) => s + Math.max(0, r.to - r.from + 1), 0);
  const full = covered === totalItems;
  const addRange = () => { const last = ranges.at(-1)?.to ?? 0; onChange([...ranges, { from: last + 1, to: Math.min(last + 1, totalItems), questionType: "multiple_choice", conceptSections: [] }]); };
  const upd = (i: number, u: Partial<RangeRow>) => onChange(ranges.map((r, idx) => idx === i ? { ...r, ...u } : r));
  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">Define item ranges. All {totalItems} items must be covered.</p>
      <div className="space-y-3">
        {ranges.map((range, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Range {i + 1} ({Math.max(0, range.to - range.from + 1)} items)</span>
              <button onClick={() => onChange(ranges.filter((_, idx) => idx !== i))} className="text-xs text-destructive hover:underline">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-xs text-muted-foreground">From</label><input type="number" min={1} max={totalItems} value={range.from} onChange={(e) => upd(i, { from: parseInt(e.target.value, 10) || 1 })} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">To</label><input type="number" min={range.from} max={totalItems} value={range.to} onChange={(e) => upd(i, { to: parseInt(e.target.value, 10) || range.from })} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" /></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Question Type</label>
              <select value={range.questionType} onChange={(e) => upd(i, { questionType: e.target.value as QuestionType })} className="w-full rounded-md border bg-background px-3 py-1.5 text-sm">
                {Q_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Concept Sections</label>
              {sections.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={range.conceptSections.includes(s.name)} onChange={(e) => upd(i, { conceptSections: e.target.checked ? [...range.conceptSections, s.name] : range.conceptSections.filter((n) => n !== s.name) })} className="rounded" />
                  <span>{s.name}</span><span className="text-xs text-muted-foreground ml-auto">{s.keywordCount} items</span>
                </label>
              ))}
              {range.conceptSections.length === 0 && <p className="text-xs text-destructive">Select at least one section.</p>}
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRange}>+ Add Range</Button>
      <div className="flex items-center gap-3 pt-1">
        <p className={cn("text-sm", full ? "text-green-600" : "text-amber-600")}>{covered} / {totalItems} items covered</p>
        <Button onClick={onNext} disabled={!full || ranges.some((r) => r.conceptSections.length === 0) || isLoading} size="sm">
          {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Generate
        </Button>
      </div>
    </div>
  );
}

function Step5({ classId, assessmentId, onQuestionsReady }: { classId: string; assessmentId: string; onQuestionsReady: (q: Question[]) => void }): React.JSX.Element {
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

function Step6({ classId, assessmentId, questions, onNext }: { classId: string; assessmentId: string; questions: Question[]; onNext: () => void }): React.JSX.Element {
  const [edits, setEdits] = useState<Record<string, { text: string; correctAnswer: string }>>(() => Object.fromEntries(questions.map((q) => [q.id, { text: q.text, correctAnswer: q.correctAnswer ?? "" }])));
  async function saveEdit(qId: string): Promise<void> {
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
            {q.type !== "essay" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Correct Answer</label>
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

function Step7({ classId, releaseDate, endDate, selectedStudentIds, onChange, onPublish, isLoading }: { classId: string; releaseDate: string; endDate: string; selectedStudentIds: string[]; onChange: (u: Partial<Pick<BuilderState, "releaseDate" | "endDate" | "selectedStudentIds">>) => void; onPublish: () => void; isLoading: boolean }): React.JSX.Element {
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

export default function NewAssessmentPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>({
    selectedLesson: null, type: "quiz", totalItems: 1,
    ranges: [], createdAssessmentId: null, generatedQuestions: [], releaseDate: "", endDate: "", selectedStudentIds: [],
  });

  const { mutateAsync: createAssessment, isPending: isCreating } = useCreateAssessment(classId);
  const { mutateAsync: updateAssessment, isPending: isUpdating } = useUpdateAssessment(classId);
  const { data: weeks } = useClassWeeks(classId);
  const patch = useCallback((u: Partial<BuilderState>) => setState((p) => ({ ...p, ...u })), []);
  const next = () => setStep((s) => s + 1);
  const concept = state.selectedLesson?.concept ?? null;

  function getTermId(): string {
    if (!state.selectedLesson || !weeks.length) return "";
    const week = weeks.find((w) => w.value === state.selectedLesson!.weekNumber);
    return week?.termId ?? "";
  }

  async function handleGenerate(): Promise<void> {
    if (!state.selectedLesson) return;
    const termId = getTermId();
    if (!termId) { toast.error("Could not determine term for this lesson's week."); return; }
    try {
      const assessment = await createAssessment({
        lessonId: state.selectedLesson.id, termId, type: state.type, totalItems: state.totalItems,
        ranges: state.ranges.map((r) => ({ from: r.from, to: r.to, questionType: r.questionType as RangeConfig["questionType"], conceptSections: r.conceptSections })),
      });
      patch({ createdAssessmentId: assessment.id });
      next();
    } catch { toast.error("Failed to create assessment."); }
  }

  async function handlePublish(): Promise<void> {
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
        {step === 2 && <Step3 type={state.type} totalItems={state.totalItems} maxItems={getTotalItems(concept)} onChange={(u) => patch(u)} onNext={next} />}
        {step === 3 && <Step4 ranges={state.ranges} totalItems={state.totalItems} sections={getConceptSections(concept)} onChange={(ranges) => patch({ ranges })} onNext={handleGenerate} isLoading={isCreating} />}
        {step === 4 && state.createdAssessmentId && <Step5 classId={classId} assessmentId={state.createdAssessmentId} onQuestionsReady={(q) => { patch({ generatedQuestions: q }); next(); }} />}
        {step === 5 && state.createdAssessmentId && <Step6 classId={classId} assessmentId={state.createdAssessmentId} questions={state.generatedQuestions} onNext={next} />}
        {step === 6 && <Step7 classId={classId} releaseDate={state.releaseDate} endDate={state.endDate} selectedStudentIds={state.selectedStudentIds} onChange={(u) => patch(u)} onPublish={handlePublish} isLoading={isUpdating} />}
      </div>
    </div>
  );
}