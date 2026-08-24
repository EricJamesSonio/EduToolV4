import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { useLessons } from "@/hooks/educator/useLessons";
import type { Lesson } from "@/types/educator/lesson.types";

export function Step1({
  classId,
  selected,
  onSelect,
  onNext,
}: {
  classId: string;
  selected: Lesson | null;
  onSelect: (l: Lesson) => void;
  onNext: () => void;
}) {
  const { data: lessons, isLoading } = useLessons(classId);
  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">Loading lessons...</p>
    );
  if (!lessons?.length)
    return (
      <p className="text-sm text-muted-foreground">
        No lessons found. Create a lesson first.
      </p>
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a lesson with a completed concept build to generate questions
        from.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson, idx) => {
          const hasConcept = !!lesson.concept;
          return (
            <button
              key={lesson.id}
              disabled={!hasConcept}
              onClick={() => {
                onSelect(lesson);
                onNext();
              }}
              className={cn(
                "rounded-xl border bg-card p-6 space-y-4 text-left transition-all duration-200",
                selected?.id === lesson.id && "border-primary shadow-sm",
                hasConcept &&
                  selected?.id !== lesson.id &&
                  "hover:border-primary/40 hover:shadow-sm",
                !hasConcept && "opacity-40 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "rounded-md p-2.5 w-fit",
                  WEEK_COLORS[idx % WEEK_COLORS.length]
                )}
              >
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">
                  Week {lesson.weekNumber}
                  {lesson.description ? ` — ${lesson.description}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "inline-block text-xs px-2 py-0.5 rounded-full border",
                  hasConcept
                    ? "badge-success"
                    : "badge-muted"
                )}
              >
                {hasConcept ? "Concept ready" : "No concept build"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
