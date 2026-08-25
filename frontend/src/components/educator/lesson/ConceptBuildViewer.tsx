"use client";

import { useState, useEffect, useRef } from "react";
import { LessonConcept } from "@/types/educator/lesson.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConceptBuildViewerProps {
  classId: string;
  lessonId: string;
  concept: LessonConcept | null;
  onBuildConcepts?: () => void;
  isExtracting?: boolean;
}

interface ConceptBuildContent {
  sections: string[];
  keywords: string[];
  questionCapacity: Record<string, number>;
  concepts: {
    name: string;
    section: string;
    definition: string;
    properties: string[];
    difficulty: "easy" | "medium" | "hard";
  }[];
}

const difficultyColors: Record<string, string> = {
  easy: "bg-[#98FB98] text-[#0B1E3A] border border-[#86EFAC]",
  medium: "bg-[#FDE68A] text-[#0B1E3A] border border-[#FCD34D]",
  hard: "bg-[#FF6B6B] text-[#0B1E3A] border border-[#E85D4E]",
};

function useProgress(isExtracting: boolean, done: boolean): number {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) {
      setProgress(100);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (isExtracting) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const step = Math.max(1, Math.floor((90 - prev) / 8));
          return Math.min(90, prev + step);
        });
      }, 1000);
    } else {
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isExtracting, done]);

  return progress;
}

export function ConceptBuildViewer({
  classId,
  lessonId,
  concept,
  onBuildConcepts,
  isExtracting = false,
}: ConceptBuildViewerProps): React.JSX.Element {
  const router = useRouter();
  const done = !!concept;
  const progress = useProgress(isExtracting, done);

  const content = concept?.content as ConceptBuildContent | undefined;
  const sections = content?.sections ?? [];
  const keywords = content?.keywords ?? [];
  const conceptsList = content?.concepts ?? [];
  const questionCapacity = content?.questionCapacity ?? {};

  return (
    <div className="rounded-lg border p-5 space-y-4">
      {/* Progress bar — always visible */}
      <Progress value={progress} className="flex-col gap-1">
        <div className="flex items-center justify-between w-full">
          <ProgressLabel>
            {done
              ? "Ready"
              : isExtracting
                ? "Building concepts..."
                : "Not started"}
          </ProgressLabel>
          <ProgressValue>{() => (done ? "100%" : `${progress}%`)}</ProgressValue>
        </div>
        <span className="sr-only">{progress}% complete</span>
      </Progress>

      {/* Content area */}
      {done && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {sections.length} sections &middot; {conceptsList.length} concepts
            </span>
            <span className="text-xs text-muted-foreground">
              Built{" "}
              {new Date(
                (concept as any).created_at ?? (concept as any).createdAt
              ).toLocaleDateString()}
            </span>
          </div>

          {/* Sections with capacities */}
          {sections.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Sections
              </h4>
              <div className="flex flex-wrap gap-2">
                {sections.map((section, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium">{section}</span>
                    <span className="text-xs text-muted-foreground">
                      (cap: {questionCapacity[section] ?? "?"})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concepts grouped by section */}
          {sections.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Concepts
              </h4>
              <div className="space-y-3">
                {sections.map((section) => {
                  const sectionConcepts = conceptsList.filter(
                    (c) => c.section === section
                  );
                  if (!sectionConcepts.length) return null;
                  return (
                    <div key={section}>
                      <h5 className="text-sm font-medium text-muted-foreground mb-1.5">
                        {section}
                      </h5>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {sectionConcepts.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-md border bg-card p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {c.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${difficultyColors[c.difficulty] ?? ""}`}
                              >
                                {c.difficulty}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {c.definition}
                            </p>
                            {c.properties.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {c.properties.map((p, j) => (
                                  <span
                                    key={j}
                                    className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!done && !isExtracting && (
        <div className="text-center text-sm text-muted-foreground">
          <p>No concept build yet.</p>
          <p className="text-xs mt-1">
            Save lesson content (10+ words) to auto-trigger extraction, or build
            manually below.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {done && (
          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/educator/classes/${classId}/assessments/new?lessonId=${lessonId}`
              )
            }
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate Assessment
          </Button>
        )}

        {onBuildConcepts && !isExtracting && (
          <Button
            size="sm"
            variant={done ? "outline" : "default"}
            onClick={onBuildConcepts}
          >
            {isExtracting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : done ? (
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {done ? "Re-build" : "Build Concepts"}
          </Button>
        )}
      </div>
    </div>
  );
}

