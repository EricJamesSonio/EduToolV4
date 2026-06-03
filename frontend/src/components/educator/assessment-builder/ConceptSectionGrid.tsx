import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { ConceptItemInfo, AssessmentSection } from "./types";

export function ConceptSectionGrid({
  grouped,
  selectedItemIndices,
  sectionIndex,
  onUpdateSection,
}: {
  grouped: { section: string; items: ConceptItemInfo[] }[];
  selectedItemIndices: number[];
  sectionIndex: number;
  onUpdateSection: (
    idx: number,
    u: Partial<AssessmentSection>
  ) => void;
}) {
  const selectedIndicesSet = new Set(selectedItemIndices);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {grouped.map((g, gi) => {
        if (!g.items.length) return null;
        const color = WEEK_COLORS[gi % WEEK_COLORS.length];
        const allSelected = g.items.every((ci) =>
          selectedIndicesSet.has(ci.index)
        );
        const someSelected = g.items.some((ci) =>
          selectedIndicesSet.has(ci.index)
        );
        return (
          <div
            key={g.section}
            className={cn(
              "rounded-lg border bg-card p-4 space-y-3",
              someSelected && "ring-1 ring-primary/20"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between -mx-4 -mt-4 mb-0 p-3 rounded-t-lg border-b",
                color
              )}
            >
              <span className="text-sm font-semibold">{g.section}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium opacity-80">
                  {g.items.length} items
                </span>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        onUpdateSection(sectionIndex, {
                          selectedItemIndices:
                            selectedItemIndices.filter(
                              (idx) =>
                                !g.items.some((ci) => ci.index === idx)
                            ),
                        });
                      } else {
                        const toAdd = g.items
                          .filter(
                            (ci) => !selectedIndicesSet.has(ci.index)
                          )
                          .map((ci) => ci.index);
                        onUpdateSection(sectionIndex, {
                          selectedItemIndices: [
                            ...selectedItemIndices,
                            ...toAdd,
                          ],
                        });
                      }
                    }}
                    className="rounded"
                  />
                  Select all
                </label>
              </div>
            </div>
            <div className="space-y-2">
              {g.items.map((ci) => {
                const isSelected = selectedIndicesSet.has(ci.index);
                const diffColor =
                  ci.difficulty === "easy"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : ci.difficulty === "hard"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-amber-100 text-amber-700 border-amber-200";
                return (
                  <label
                    key={ci.index}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/20"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={isSelected}
                      onChange={() => {
                        onUpdateSection(sectionIndex, {
                          selectedItemIndices: isSelected
                            ? selectedItemIndices.filter(
                                (idx) => idx !== ci.index
                              )
                            : [...selectedItemIndices, ci.index],
                        });
                      }}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {ci.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border",
                            diffColor
                          )}
                        >
                          {ci.difficulty}
                        </span>
                      </div>
                      {ci.definition && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {ci.definition}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
