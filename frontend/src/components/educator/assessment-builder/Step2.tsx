import { Button } from "@/components/ui/button";
import { getConceptContent } from "./utils";
import type { LessonConcept } from "@/types/educator/lesson.types";

export function Step2({
  concept,
  onNext,
}: {
  concept: LessonConcept | null;
  onNext: () => void;
}) {
  const cc = getConceptContent(concept);
  if (!cc.sections.length)
    return (
      <p className="text-sm text-muted-foreground">
        No concept build available.
      </p>
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review concept sections used to generate questions.
      </p>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="divide-y">
          {cc.sections.map((name) => {
            const count = cc.conceptItems.filter(
              (ci) => ci.section === name
            ).length;
            return (
              <div
                key={name}
                className="px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {count} items
                </span>
              </div>
            );
          })}
          <div className="px-4 py-3 flex items-center justify-between bg-muted/20">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">
              {cc.conceptItems.length} items
            </span>
          </div>
        </div>
        <Button onClick={onNext} size="sm">
          Next
        </Button>
      </div>
    </div>
  );
}
