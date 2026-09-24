import type { ProgramType } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSchoolProfileDraft,
} from "@/hooks/admin/useSchoolProfileDraft";
import type {
  DraftGradingRange,
  DraftGradingScale,
} from "@/hooks/admin/useSchoolProfileDraft";

type SchoolProfileDraft = ReturnType<typeof useSchoolProfileDraft>;

type GradingScaleSectionProps = {
  departments: Array<{ type: ProgramType }>;
  draft: SchoolProfileDraft;
  readOnly: boolean;
  saveMutationPending: boolean;
};

function GradingScaleRangeRow({
  range,
  readOnly,
  onLabelChange,
  onMinChange,
  onMaxChange,
  onGradeChange,
  onDelete,
  canDelete,
}: {
  range: DraftGradingRange;
  readOnly: boolean;
  onLabelChange: (value: string) => void;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onGradeChange: (value: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div className="rounded-md border bg-background p-2.5">
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
            Label
          </label>
          <Input
            value={range.label}
            disabled={readOnly}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="Label"
            className="h-9 text-xs"
          />
        </div>

        <div className="flex flex-col gap-2 max-sm:flex-row max-sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
              Min
            </label>
            <Input
              type="number"
              value={range.minScore}
              disabled={readOnly}
              onChange={(event) => onMinChange(Number(event.target.value))}
              placeholder="Min"
              className="h-9 text-xs"
            />
          </div>

          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
              Max
            </label>
            <Input
              type="number"
              value={range.maxScore}
              disabled={readOnly}
              onChange={(event) => onMaxChange(Number(event.target.value))}
              placeholder="Max"
              className="h-9 text-xs"
            />
          </div>

          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
              Grade
            </label>
            <Input
              value={range.gradeValue}
              disabled={readOnly}
              onChange={(event) => onGradeChange(event.target.value)}
              placeholder="Grade"
              className="h-9 text-xs"
            />
          </div>

          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs whitespace-nowrap"
              onClick={onDelete}
              disabled={!canDelete}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SchoolProfileGradingScaleSection({
  departments,
  draft,
  readOnly,
  saveMutationPending,
}: GradingScaleSectionProps) {
  const scaleMap = draft.gradingScales as Record<string, DraftGradingScale>;

  return (
    <div className="space-y-4">
      {departments.map((dept) => {
        const scale = scaleMap[dept.type];
        if (!scale) return null;

        return (
          <div
            key={dept.type}
            className="rounded-lg border p-4 space-y-3 bg-muted/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {PROGRAM_TYPE_LABELS[dept.type]}
              </span>
              <span className="text-xs text-muted-foreground">
                {scale.ranges.length} ranges
              </span>
            </div>

            <Input
              value={scale.name}
              disabled={readOnly || saveMutationPending}
              onChange={(event) =>
                draft.updateGradingScale(dept.type, {
                  name: event.target.value,
                })
              }
              placeholder="Scale name"
              className="h-8 text-sm"
            />

            <div className="space-y-2">
              {scale.ranges.map((range) => (
                <GradingScaleRangeRow
                  key={range.key}
                  range={range}
                  readOnly={readOnly}
                  onLabelChange={(value) =>
                    draft.updateGradingRange(dept.type, range.key, {
                      label: value,
                    })
                  }
                  onMinChange={(value) =>
                    draft.updateGradingRange(dept.type, range.key, {
                      minScore: value,
                    })
                  }
                  onMaxChange={(value) =>
                    draft.updateGradingRange(dept.type, range.key, {
                      maxScore: value,
                    })
                  }
                  onGradeChange={(value) =>
                    draft.updateGradingRange(dept.type, range.key, {
                      gradeValue: value,
                    })
                  }
                  onDelete={() => draft.deleteGradingRange(dept.type, range.key)}
                  canDelete={scale.ranges.length > 1}
                />
              ))}
            </div>

            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  draft.addGradingRange(dept.type, {
                    label: "New Range",
                    minScore: 0,
                    maxScore: 100,
                    gradeValue: "X",
                  })
                }
              >
                + Add Range
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
