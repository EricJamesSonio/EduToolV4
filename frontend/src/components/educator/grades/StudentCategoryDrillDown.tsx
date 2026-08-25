import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { StudentGrade } from "@/types/educator/grade.types";
import { fmt } from "./utils";

export function StudentCategoryDrillDown({
  student,
  category,
  onClose,
}: {
  student: StudentGrade | null;
  category: string | null;
  onClose: () => void;
}) {
  if (!student || !category) return null;

  const bd = student.categoryBreakdown.find(
    (c) => c.category.toLowerCase() === category.toLowerCase()
  );
  const categoryType = bd?.type;

  const assessments = student.assessmentScores
    .filter((a) => categoryType ? a.type.toLowerCase() === categoryType.toLowerCase() : a.type.toLowerCase() === category.toLowerCase())
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg capitalize">
            {student.studentName} &mdash; {category}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments in this category.</p>
          ) : (
            <div className="space-y-3">
              {assessments.map((a, i) => {
                const earned = a.manualScore ?? a.score;
                return (
                  <div key={a.assessmentId} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", WEEK_COLORS[i % WEEK_COLORS.length].split(" ")[0])} />
                      <span className="text-sm font-medium capitalize">{a.type}</span>
                    </div>
                    <span className="text-sm tabular-nums">
                      {earned !== null ? (
                        <>{fmt(earned, 0)}/{a.totalItems}</>
                      ) : a.isMissed ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#FF6B6B] text-[#0B1E3A] border border-[#E85D4E] text-[10px] font-bold">M</span>
                      ) : a.isExempted ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#FDE68A] text-[#0B1E3A] border border-[#FCD34D] text-[10px] font-bold">E</span>
                      ) : a.status === 'custom' ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#FDE68A] text-[#0B1E3A] border border-[#FCD34D] text-[10px] font-bold">C</span>
                      ) : (
                        <span className="text-muted-foreground/50">&mdash;</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm font-semibold">Average</span>
            <span className="text-sm font-bold tabular-nums">
              {bd ? `${fmt(bd.rawAverage)}%` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

