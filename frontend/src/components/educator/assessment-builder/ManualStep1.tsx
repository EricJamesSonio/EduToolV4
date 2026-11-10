import { Button } from "@/components/ui/button";
import { TYPE_LABELS } from "./constants";
import type { BuilderState, AssessmentType } from "./types";

export function ManualStep1({
  type,
  title,
  totalItems,
  manualInstructions,
  schemeTypes,
  onChange,
  onNext,
}: {
  type: string;
  title: string;
  totalItems: number;
  manualInstructions: string;
  schemeTypes: string[];
  onChange: (u: Partial<BuilderState>) => void;
  onNext: () => void;
}) {
  const valid = !!type && !!manualInstructions.trim() && totalItems >= 1;
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
                onChange({
                  type: e.target.value as AssessmentType,
                })
              }
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            >
              <option value="">Select type...</option>
              {schemeTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t] ??
                    t.replace(/_/g, " ")}
                </option>
              ))}
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
              Total Items / Max Score{" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={totalItems}
              onChange={(e) =>
                onChange({
                  totalItems: Math.max(
                    1,
                    parseInt(e.target.value, 10) || 1
                  ),
                })
              }
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Maximum possible score for this manual assessment.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Instructions <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Describe the task, project, or criteria for this manual
            assessment.
          </p>
          <textarea
            value={manualInstructions}
            onChange={(e) =>
              onChange({ manualInstructions: e.target.value })
            }
            placeholder={`e.g., "This is the score based on your behavior as a student."\n\ne.g., "Create a website and submit the GitHub link."`}
            rows={8}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      <Button onClick={onNext} disabled={!valid} size="sm">
        Next
      </Button>
    </div>
  );
}