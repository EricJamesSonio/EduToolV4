import type { ProgramType } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useSchoolProfileDraft,
} from "@/hooks/admin/useSchoolProfileDraft";
import type {
  DraftGradingScheme,
} from "@/hooks/admin/useSchoolProfileDraft";

type SchoolProfileDraft = ReturnType<typeof useSchoolProfileDraft>;

type GradingSchemeSectionProps = {
  departments: Array<{ type: ProgramType }>;
  draft: SchoolProfileDraft;
  readOnly: boolean;
  saveMutationPending: boolean;
};

export function SchoolProfileGradingSchemeSection({
  departments,
  draft,
  readOnly,
  saveMutationPending,
}: GradingSchemeSectionProps) {
  const schemeMap = draft.gradingSchemes as Record<string, DraftGradingScheme>;

  return (
    <div className="space-y-4">
      {departments.map((dept) => {
        const scheme = schemeMap[dept.type];
        if (!scheme) return null;

        const weightSum = scheme.components.reduce(
          (sum, component) => sum + Number(component.weight),
          0,
        );

        return (
          <div
            key={dept.type}
            className="rounded-lg border p-4 space-y-3 bg-muted/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {PROGRAM_TYPE_LABELS[dept.type]}
              </span>
              <span
                className={cn(
                  "text-xs",
                  Math.abs(weightSum - 100) > 0.01
                    ? "text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                Sum: {weightSum}% {Math.abs(weightSum - 100) > 0.01 && "(must be 100)"}
              </span>
            </div>

            <Input
              value={scheme.name}
              disabled={readOnly || saveMutationPending}
              onChange={(event) =>
                draft.updateGradingScheme(dept.type, {
                  name: event.target.value,
                })
              }
              placeholder="Scheme name"
              className="h-8 text-sm"
            />

            <div className="space-y-2">
              {scheme.components.map((component) => (
                <div
                  key={component.key}
                  className="rounded-md border bg-background p-2.5"
                >
                  <div className="flex flex-col gap-2">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
                        Component
                      </label>
                      <Input
                        value={component.name}
                        disabled={readOnly}
                        onChange={(event) =>
                          draft.updateSchemeComponent(dept.type, component.key, {
                            name: event.target.value,
                          })
                        }
                        placeholder="Component"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,180px)_minmax(0,210px)] sm:items-end">
                      <div className="min-w-0">
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
                          Type
                        </label>
                        <select
                          value={component.type}
                          disabled={readOnly}
                          onChange={(event) =>
                            draft.updateSchemeComponent(dept.type, component.key, {
                              type: event.target.value,
                            })
                          }
                          className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                        >
                          <option value="quiz">quiz</option>
                          <option value="activity">activity</option>
                          <option value="manual">manual</option>
                          <option value="exam">exam</option>
                          <option value="participation">participation</option>
                          <option value="behavior">behavior</option>
                          <option value="other">other</option>
                        </select>
                      </div>

                      {!readOnly && (
                        <div className="flex items-end gap-2">
                          <div className="min-w-0 flex-1">
                            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
                              Weight
                            </label>
                            <Input
                              type="number"
                              value={component.weight}
                              disabled={readOnly}
                              onChange={(event) =>
                                draft.updateSchemeComponent(dept.type, component.key, {
                                  weight: Number(event.target.value),
                                })
                              }
                              placeholder="Weight"
                              className="h-9 text-xs"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 px-2 text-xs"
                            onClick={() =>
                              draft.deleteSchemeComponent(dept.type, component.key)
                            }
                            disabled={scheme.components.length <= 1}
                          >
                            Remove
                          </Button>
                        </div>
                      )}

                      {readOnly && (
                        <div className="min-w-0">
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
                            Weight
                          </label>
                          <Input
                            type="number"
                            value={component.weight}
                            disabled={readOnly}
                            onChange={(event) =>
                              draft.updateSchemeComponent(dept.type, component.key, {
                                weight: Number(event.target.value),
                              })
                            }
                            placeholder="Weight"
                            className="h-9 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={!!component.isOptional}
                      disabled={readOnly}
                      onChange={(event) =>
                        draft.updateSchemeComponent(dept.type, component.key, {
                          isOptional: event.target.checked,
                        })
                      }
                    />
                    Optional
                  </label>
                </div>
              ))}
            </div>

            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  draft.addSchemeComponent(dept.type, {
                    name: "New Component",
                    type: "quiz",
                    weight: 10,
                    isOptional: false,
                  })
                }
              >
                + Add Component
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
