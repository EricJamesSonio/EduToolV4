import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { educatorClassApi } from "@/api/educator/class.api";
import type { BuilderState } from "./types";

export function Step6({
  classId,
  releaseDate,
  endDate,
  selectedStudentIds,
  termInfo,
  onChange,
  onPublish,
  isLoading,
}: {
  classId: string;
  releaseDate: string;
  endDate: string;
  selectedStudentIds: string[];
  termInfo: { termName: string; semesterName: string } | null;
  onChange: (
    u: Partial<
      Pick<
        BuilderState,
        "releaseDate" | "endDate" | "selectedStudentIds"
      >
    >
  ) => void;
  onPublish: () => void;
  isLoading: boolean;
}) {
  const datesMissing = !releaseDate || !endDate;
  const invalid =
    datesMissing || new Date(endDate) <= new Date(releaseDate);
  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: !!classId,
  });

  return (
    <div className="space-y-6">
      {termInfo && (
        <div className="rounded-xl border bg-card p-6 text-sm">
          <span className="text-muted-foreground">
            Assessment will be registered in:{" "}
          </span>
          <span className="font-semibold">
            {termInfo.termName} ({termInfo.semesterName})
          </span>
        </div>
      )}
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
                        : selectedStudentIds.filter((id) => id !== s.id),
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
                onClick={() => onChange({ selectedStudentIds: [] })}
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
          onClick={onPublish}
          disabled={isLoading || !!invalid}
          size="sm"
        >
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Publish Assessment
        </Button>
        <p className="text-xs text-destructive">
          Release date and end date are required.
        </p>
        {!datesMissing && invalid && (
          <p className="text-xs text-destructive">
            End date must be after release date.
          </p>
        )}
      </div>
    </div>
  );
}
