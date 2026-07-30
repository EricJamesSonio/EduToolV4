import { Loader2 } from "lucide-react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Button } from "@/components/ui/button";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { educatorClassApi } from "@/api/educator/class.api";
import type { BuilderState } from "./types";

export function ManualStep2({
  classId,
  totalItems,
  weekNumber,
  releaseDate,
  endDate,
  selectedStudentIds,
  selectedTermId,
  onChange,
  onCreate,
  isLoading,
}: {
  classId: string;
  totalItems: number;
  weekNumber: number;
  releaseDate: string;
  endDate: string;
  selectedStudentIds: string[];
  selectedTermId: string;
  onChange: (u: Partial<BuilderState>) => void;
  onCreate: () => void;
  isLoading: boolean;
}) {
  const invalid =
    !releaseDate ||
    !endDate ||
    new Date(endDate) <= new Date(releaseDate);
  const { data: weeks = [] } = useClassWeeks(classId);
  const { data: students } = useAsyncQuery(
    queryKeys.educator.classes.students(classId),
    () => educatorClassApi.getStudents(classId),
    { enabled: !!classId },
  );

  const termMap = new Map<
    string,
    { label: string; weeks: { value: number; label: string }[] }
  >();
  for (const w of weeks) {
    if (!termMap.has(w.termId))
      termMap.set(w.termId, { label: w.termName, weeks: [] });
    termMap.get(w.termId)!.weeks.push({
      value: w.value,
      label: w.label,
    });
  }

  const termOptions = Array.from(termMap.entries()).map(([id, v]) => ({
    id,
    ...v,
  }));

  const filteredWeeks = selectedTermId
    ? termMap.get(selectedTermId)?.weeks ?? []
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
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
            className="w-24 rounded-md border bg-card px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Maximum possible score for this manual assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Term <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedTermId}
              onChange={(e) => {
                onChange({
                  selectedTermId: e.target.value,
                  weekNumber: 0,
                });
              }}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            >
              <option value="">Select term...</option>
              {termOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Week <span className="text-destructive">*</span>
            </label>
            <select
              value={
                selectedTermId && weekNumber ? `${weekNumber}` : ""
              }
              onChange={(e) => {
                const wn = parseInt(e.target.value, 10);
                const w = weeks.find(
                  (x) =>
                    x.value === wn && x.termId === selectedTermId
                );
                if (w)
                  onChange({
                    weekNumber: wn,
                    selectedTermId: w.termId,
                  });
              }}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            >
              <option value="">Select week...</option>
              {filteredWeeks.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Release Date <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              value={releaseDate}
              onChange={(e) =>
                onChange({ releaseDate: e.target.value })
              }
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              End Date <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            />
            {invalid && (
              <p className="text-xs text-destructive">
                End date must be after release date.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Assign to Students
          </label>
          <p className="text-xs text-muted-foreground">
            Leave empty to assign to all enrolled students.
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
            {students?.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No enrolled students.
              </p>
            )}
            {students?.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(s.id)}
                  onChange={(e) =>
                    onChange({
                      selectedStudentIds: e.target.checked
                        ? [...selectedStudentIds, s.id]
                        : selectedStudentIds.filter(
                            (id) => id !== s.id
                          ),
                    })
                  }
                  className="rounded"
                />
                <span>{s.fullName}</span>
                {s.email && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {s.email}
                  </span>
                )}
              </label>
            ))}
          </div>
          {students && students.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    selectedStudentIds: students.map((s) => s.id),
                  })
                }
                className="text-xs text-primary hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ selectedStudentIds: [] })
                }
                className="text-xs text-muted-foreground hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pt-1 space-y-2">
        <Button
          onClick={onCreate}
          disabled={isLoading || !!invalid}
          size="sm"
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Manual Assessment
        </Button>
        {(!releaseDate || !endDate) && (
          <p className="text-xs text-destructive">
            Release date and end date are required.
          </p>
        )}
        {releaseDate && endDate && invalid && (
          <p className="text-xs text-destructive">
            End date must be after release date.
          </p>
        )}
      </div>
    </div>
  );
}
