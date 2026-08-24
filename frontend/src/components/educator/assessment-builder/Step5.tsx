import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS } from "./constants";
import type {
  ConceptItemInfo,
  BuilderState,
} from "./types";
import type { Question } from "@/types/educator/assessment.types";

/* ─── Inline question card for Step5 ──────────────────────────────── */

function QuestionCard({
  question,
  index,
  edits,
}: {
  question: Question;
  index: number;
  edits: Record<string, { text: string; correctAnswer: string }>;
}) {
  const isManualQ =
    question.type === "manual" || (question as any).isManual;
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {index > 0 && <>Item {index}</>}
          {isManualQ && (
            <span className="ml-2 text-warning">
              (Manually graded)
            </span>
          )}
        </span>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Question</label>
        <p className="text-sm bg-muted/30 rounded border px-3 py-2">
          {question.text}
        </p>
      </div>
      {question.choices && question.choices.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Choices</label>
          <div className="space-y-1">
            {question.choices.map((c) => (
              <div
                key={c.label}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-sm border",
                  question.correctAnswer === c.text
                    ? "border-success/30 bg-success/10"
                    : "border-border"
                )}
              >
                <span className="font-mono text-xs font-bold w-5">
                  {c.label}.
                </span>
                <span>{c.text}</span>
                {question.correctAnswer === c.text && (
                  <span className="text-xs text-success ml-auto font-medium">
                    Correct
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {!isManualQ && question.type !== "essay" && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Answer</label>
          <p className="text-sm bg-muted/30 rounded border px-3 py-2">
            {question.correctAnswer ?? "(not set)"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Step5: Final Review ─────────────────────────────────────────── */

export function Step5({
  classId,
  previewId,
  questions,
  state,
  conceptItems,
  sectionNames,
  termInfo,
  onNext,
}: {
  classId: string;
  previewId: string;
  questions: Question[];
  state: BuilderState;
  conceptItems: ConceptItemInfo[];
  sectionNames: string[];
  termInfo: {
    termId: string;
    termName: string;
    semesterName: string;
  } | null;
  onNext: () => void;
}) {
  const [edits] = useState<
    Record<string, { text: string; correctAnswer: string }>
  >(() =>
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        { text: q.text, correctAnswer: q.correctAnswer ?? "" },
      ])
    )
  );

  let qCursor = 0;
  const groups = state.sections.map((sec, si) => {
    if (sec.questionType === "manual") {
      const q = questions.find((qq) => qq.isManual);
      if (q) qCursor++;
      return { section: sec, questions: q ? [q] : [] };
    }
    const count = sec.to - sec.from + 1;
    const secQs = questions
      .slice(qCursor, qCursor + count)
      .filter((qq) => !qq.isManual);
    qCursor += count;
    return { section: sec, questions: secQs };
  });

  const aiSections = state.sections.filter(
    (s) => s.questionType !== "manual"
  );
  const manualSections = state.sections.filter(
    (s) => s.questionType === "manual"
  );
  const aiItemCount = aiSections.reduce(
    (s, sec) => s + (sec.to - sec.from + 1),
    0
  );
  const manualScoreTotal = manualSections.reduce(
    (s, sec) => s + (sec.manualMaxScore ?? 1),
    0
  );

  return (
    <div className="space-y-6">
      {/* ── Assessment Summary Card ── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Check className="h-5 w-5 text-success" />
          Assessment Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Type
            </p>
            <p className="text-sm font-medium mt-0.5">
              {TYPE_LABELS[state.type] ?? state.type}
            </p>
          </div>
          {state.title && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Title
              </p>
              <p className="text-sm font-medium mt-0.5">{state.title}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Grading Mode
            </p>
            <p className="text-sm font-medium mt-0.5 capitalize">
              {state.gradingMode === "hybrid"
                ? "Hybrid"
                : state.gradingMode === "system"
                  ? "System-Graded"
                  : "Manual-Graded"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Items
            </p>
            <p className="text-sm font-medium mt-0.5">
              {state.totalItems}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Breakdown Visible
            </p>
            <p className="text-sm font-medium mt-0.5">
              {state.showBreakdown ? "Yes" : "No"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{aiItemCount}</strong>{" "}
            AI-generated items
          </span>
          <span>
            <strong className="text-foreground">
              {manualScoreTotal}
            </strong>{" "}
            manual max score
          </span>
          <span>
            <strong className="text-foreground">
              {conceptItems.length}
            </strong>{" "}
            concept build items available
          </span>
          {state.selectedLesson && (
            <span>Lesson: {state.selectedLesson.title}</span>
          )}
          <span>
            {sectionNames.length} concept section
            {sectionNames.length !== 1 ? "s" : ""}
          </span>
          {termInfo && (
            <span>
              Term: <strong>{termInfo.termName}</strong> (
              {termInfo.semesterName})
            </span>
          )}
        </div>
        {questions.length > 0 && (
          <div className="pt-2 border-t flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {questions.length} question
              {questions.length !== 1 ? "s" : ""}
            </span>
            {questions.filter((q) => q.isManual).length > 0 && (
              <span className="text-warning">
                {questions.filter((q) => q.isManual).length} manually graded
              </span>
            )}
            <span className="text-success">
              {questions.filter((q) => !q.isManual).length} auto-graded
            </span>
          </div>
        )}
      </div>

      {/* ── Sections Overview ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sections
        </h3>
        <div className="space-y-2">
          {state.sections.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
              No sections configured.
            </p>
          )}
          {state.sections.map((sec, si) => {
            const group = groups[si];
            const secQs = group?.questions ?? [];

            if (sec.questionType === "manual") {
              return (
                <div
                  key={sec.id}
                  className="rounded-lg border bg-warning/10 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Section {si + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full border badge-warning">
                        Manual (Educator-Written)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Max Score:{" "}
                        <strong>{sec.manualMaxScore ?? 1}</strong>
                      </span>
                    </div>
                  </div>
                  {sec.manualQuestionText && (
                    <p className="text-sm bg-white rounded border px-3 py-2 italic text-muted-foreground">
                      &ldquo;{sec.manualQuestionText}&rdquo;
                    </p>
                  )}
                  {secQs.length > 0 && (
                    <QuestionCard
                      question={secQs[0]}
                      index={-1}
                      edits={edits}
                    />
                  )}
                </div>
              );
            }

            const count = sec.to - sec.from + 1;
            const selectedConceptNames = [
              ...new Set(
                sec.selectedItemIndices
                  .map((idx) => conceptItems[idx]?.section)
                  .filter(Boolean)
              ),
            ];

            return (
              <div
                key={sec.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Section {si + 1}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border badge-info">
                      {sec.questionType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Items <strong>{sec.from}–{sec.to}</strong>
                    </span>
                    <span>
                      Count: <strong>{count}</strong>
                    </span>
                    {secQs.length > 0 && (
                      <span>
                        {secQs.length} question
                        {secQs.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                {selectedConceptNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConceptNames.map((name) => (
                      <span
                        key={name}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-2 pt-2 border-t">
                  {secQs.map((q, qi) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={qi + 1}
                      edits={edits}
                    />
                  ))}
                  {secQs.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No questions generated for this section.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Continue Button ── */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <Button
          onClick={onNext}
          disabled={questions.length === 0}
          size="default"
        >
          Continue to Dates
        </Button>
        {questions.length === 0 && (
          <p className="text-xs text-destructive">
            No questions to review.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Dates and student assignment will be set in the next step.
        </p>
      </div>
    </div>
  );
}
