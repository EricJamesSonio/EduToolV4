import { useState } from "react";
import { Check, Sparkles, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GRADING_MODE_LABELS } from "./constants";
import type { BuilderState, GradingMode } from "./types";

export function Step0({
  gradingMode,
  showBreakdown,
  onChange,
  onNext,
}: {
  gradingMode: GradingMode;
  showBreakdown: boolean;
  onChange: (u: Partial<BuilderState>) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<GradingMode | null>(null);
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how this assessment will be graded.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["system", "manual"] as const).map((mode, i) => {
          const isSelected = gradingMode === mode;
          return (
            <div
              key={mode}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelected(mode);
                onChange({ gradingMode: mode });
                onNext();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(mode);
                  onChange({ gradingMode: mode });
                  onNext();
                }
              }}
              className={cn(
                "relative rounded-xl border bg-card p-6 space-y-4 text-left transition-all duration-200 cursor-pointer select-none",
                isSelected
                  ? "border-primary shadow-sm ring-1 ring-primary/20"
                  : "hover:border-primary/40 hover:shadow-sm"
              )}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <div
                className={cn(
                  "rounded-md p-2.5 w-fit",
                  i === 0
                    ? "bg-[#93C5FD] text-[#0B1E3A] border border-[#60A5FA]"
                    : "bg-[#FDE68A] text-[#0B1E3A] border border-[#FCD34D]"
                )}
              >
                {mode === "system" ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {GRADING_MODE_LABELS[mode]}
                </p>
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
        <input
          type="checkbox"
          checked={showBreakdown}
          onChange={(e) => onChange({ showBreakdown: e.target.checked })}
          className="rounded"
        />
        Show breakdown to students
      </label>
      <Button onClick={onNext} size="sm">
        Next
      </Button>
    </div>
  );
}

