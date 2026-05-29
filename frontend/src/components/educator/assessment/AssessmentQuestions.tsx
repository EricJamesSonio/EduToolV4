"use client";

import { cn } from "@/lib/utils";
import type { Question, GradingMode } from "@/types/educator/assessment.types";

interface AssessmentQuestionsProps {
  questions: Question[];
  gradingMode?: GradingMode;
  isBeforeRelease: boolean;
}

export function AssessmentQuestions({
  questions,
  gradingMode,
  isBeforeRelease,
}: AssessmentQuestionsProps): React.JSX.Element {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold mb-3">
          {gradingMode === "manual" ? "Instructions for Students" : "Questions"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {gradingMode === "manual"
            ? "No instructions provided."
            : "Questions are being generated..."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {gradingMode === "manual"
            ? "Instructions for Students"
            : "Questions"}
        </h2>
        {gradingMode !== "manual" && !isBeforeRelease && (
          <span className="text-xs text-muted-foreground">
            Locked after release
          </span>
        )}
      </div>

      {gradingMode === "manual" ? (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border bg-muted/20 p-5"
            >
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Instructions
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {q.text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl border bg-background p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Item {i + 1} — {q.type.replace(/_/g, " ")}
                </span>
              </div>

              <p className="text-sm leading-relaxed">
                {q.text}
              </p>

              {q.choices && q.choices.length > 0 && (
                <div className="space-y-2">
                  {q.choices.map((c) => (
                    <div
                      key={c.label}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                        q.correctAnswer === c.text
                          ? "border-green-300 bg-green-50"
                          : "bg-white"
                      )}
                    >
                      <span className="w-5 font-mono text-xs font-bold">
                        {c.label}.
                      </span>
                      <span>{c.text}</span>
                      {q.correctAnswer === c.text && (
                        <span className="ml-auto text-xs font-medium text-green-600">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {q.correctAnswer && q.type !== "multiple_choice" && (
                <p className="text-xs text-muted-foreground">
                  Answer:{" "}
                  <span className="text-foreground">{q.correctAnswer}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
