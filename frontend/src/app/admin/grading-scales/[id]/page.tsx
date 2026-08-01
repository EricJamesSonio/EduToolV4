"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import { useGradingScales } from "@/hooks/admin/useGradingScales";
import type { GradeRange } from "@/types/admin/grading-scale.types";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import {
  GradingScaleRangeEditor,
  validateRanges,
} from "@/components/admin/grading-scale/GradingScaleRangeEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Lock, ArrowLeft, Save } from "lucide-react";
import type { AxiosError } from "axios";

export default function GradingScaleDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: scales = [], isLoading } = useGradingScales();
  const scale = scales.find((s) => s.id === id);

  const [name, setName] = useState("");
  const [ranges, setRanges] = useState<GradeRange[]>([]);
  const [rangeErrors, setRangeErrors] = useState<ReturnType<typeof validateRanges>>([]);
  const [submitted, setSubmitted] = useState(false);
const [initialised, setInitialised] = useState(false)

  useEffect(() => {
    if (scale && !initialised) {
      setName(scale.name)
      setRanges(scale.ranges)
      setInitialised(true)
    }
  }, [scale, initialised])

  const mutation = useMutation({
    mutationFn: ({ name, ranges }: { name: string; ranges: GradeRange[] }) =>
      gradingScaleApi.update(id, { name, ranges }),
    onSuccess: () => {
      toast.success("Grading scale saved.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gradingScales.list() });
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save grading scale.");
    },
  });

  const handleSave = () => {
    setSubmitted(true);
    const errs = validateRanges(ranges);
    setRangeErrors(errs);
    if (errs.length > 0 || !name.trim()) return;
    mutation.mutate({ name, ranges });
  };

  const handleRangesChange = (next: GradeRange[]) => {
    setRanges(next);
    if (submitted) setRangeErrors(validateRanges(next));
  };

  const isLocked = scale?.isLocked ?? false;
  const disabled = isLocked || mutation.isPending;

  // Passing threshold display
  const passingThreshold = (() => {
    const passing = ranges.filter((r) => r.isPassing);
    if (passing.length === 0) return "—";
    return `${Math.min(...passing.map((r) => r.minPercent))}%`;
  })();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!scale) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground not-interactive">Grading scale not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={scale.name}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/grading-scales")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button
              size="sm"
              disabled={disabled}
              onClick={handleSave}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      />

      {/* Lock banner */}
      {isLocked && (
        <div className="flex items-center gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <strong>Locked</strong> — this scale is locked because a grade has been finalized for
            this level in the current school year. It cannot be edited.
          </span>
        </div>
      )}

      {/* Meta row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Name */}
        <div className="space-y-1.5 sm:col-span-1">
        </div>
      </div>

      {/* Range Editor */}
      <div className="space-y-2">
        <Label>Grade Ranges</Label>
        <div className="rounded-md border p-4">
          <GradingScaleRangeEditor
            ranges={ranges}
            onChange={handleRangesChange}
            disabled={disabled}
            errors={rangeErrors}
          />
        </div>
      </div>
    </div>
  );
}