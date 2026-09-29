"use client";

import { useMemo, memo } from "react";
import { Loader2, Lock } from "lucide-react";
import { ExcelTable, ExcelColumn } from "@/components/shared/ExcelTable";
import { cn } from "@/lib/utils";
import type { TermGrades, StudentGrade } from "@/types/educator/grade.types";
import { EmptyState } from "./EmptyState";
import { StatusCell } from "./StatusCell";
import { ManualCell } from "./ManualCell";
import { useAssessmentStatusOverride } from "@/hooks/educator/useGrades";
import { gradeColor, fmt } from "./utils";

export function DefaultGradeTableInner({
  classId,
  termData,
  onManualCommit,
  saving,
  refreshKey,
  isLocked,
  onRefresh,
}: {
  classId: string;
  termData: TermGrades;
  onManualCommit: (studentId: string, category: string, value: number) => void;
  saving: Set<string>;
  refreshKey: number;
  isLocked: boolean;
  onRefresh: () => void;
}) {
  const { students } = termData;
  const overrideMutation = useAssessmentStatusOverride(classId, termData.termId);

  // Perf Phase 7: derived columns memoized; per-student score/category maps
  // make cell render O(1) (was .find() per cell). Hooks stay above the empty
  // early-return so hook order is unconditional.
  const allAssessments = useMemo(
    () =>
      Array.from(
        new Map(
          students.flatMap((s) =>
            s.assessmentScores.map((a) => [
              a.assessmentId,
              { id: a.assessmentId, type: a.type, title: a.title, created_at: a.created_at ?? null },
            ])
          )
        ).values()
      ).sort((a, b) => {
        if (!a.created_at && !b.created_at) return 0;
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }),
    [students]
  );

  const manualCats = useMemo(
    () =>
      Array.from(
        new Set(
          students.flatMap((s) =>
            s.categoryBreakdown
              .filter((c) => c.manualScore !== null)
              .map((c) => c.category)
          )
        )
      ),
    [students]
  );

  const scoresByStudent = useMemo(() => {
    const map = new Map<string, Map<string, StudentGrade["assessmentScores"][number]>>();
    for (const s of students) {
      const byAssessment = new Map<string, StudentGrade["assessmentScores"][number]>();
      for (const a of s.assessmentScores) {
        if (!byAssessment.has(a.assessmentId)) byAssessment.set(a.assessmentId, a);
      }
      map.set(s.studentId, byAssessment);
    }
    return map;
  }, [students]);

  const breakdownByStudent = useMemo(() => {
    const map = new Map<string, Map<string, StudentGrade["categoryBreakdown"][number]>>();
    for (const s of students) {
      const byCat = new Map<string, StudentGrade["categoryBreakdown"][number]>();
      for (const c of s.categoryBreakdown) {
        const key = c.category.toLowerCase();
        if (!byCat.has(key)) byCat.set(key, c);
      }
      map.set(s.studentId, byCat);
    }
    return map;
  }, [students]);

  const columns: ExcelColumn<StudentGrade>[] = useMemo(
    () => [
      {
        key: "student",
        label: "Student",
        width: 200,
        sticky: true,
        render: (student) => {
          const isSaving = saving.has(student.studentId);
          return (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-[#BFDBFE] border border-[#93C5FD] flex items-center justify-center text-[9px] font-bold text-[#0B1E3A] shrink-0">
                {student.studentName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="font-medium truncate text-[11px]">{student.studentName}</p>
                <p className="text-[9px] text-muted-foreground font-mono leading-none">{student.studentCode}</p>
              </div>
              {isSaving && <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground shrink-0" />}
              {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
            </div>
          );
        },
    },
    ...allAssessments.map((a) => ({
      key: a.id,
      label: a.title ?? a.type,
      width: 80,
      render: (student: StudentGrade) => {
        const score = scoresByStudent.get(student.studentId)?.get(a.id);
        return (
          <div className="flex justify-center">
            <StatusCell
              score={score?.manualScore ?? score?.score ?? null}
              classId={classId}
              assessmentId={a.id}
              submissionId={score?.submissionId}
              studentId={student.studentId}
              isMissed={score?.isMissed}
              isExempted={score?.isExempted}
              status={score?.status ?? 'not_started'}
              totalItems={score?.totalItems ?? 0}
              onStatusChange={onRefresh}
              isLocked={isLocked}
              compact
              included={score?.included ?? true}
              inclusionReason={score?.inclusionReason}
              onOverride={(overrideStatus) =>
                overrideMutation.mutate({
                  studentId: student.studentId,
                  assessmentId: a.id,
                  overrideStatus,
                })
              }
            />
          </div>
        );
      },
    })),
    ...manualCats.map((cat) => ({
      key: `manual_${cat}`,
      label: cat,
      width: 75,
      render: (student: StudentGrade) => {
        const breakdown = breakdownByStudent.get(student.studentId)?.get(cat.toLowerCase());
        return (
          <ManualCell
            value={breakdown?.manualScore ?? null}
            studentId={student.studentId}
            category={cat}
            isLocked={isLocked}
            onCommit={onManualCommit}
            compact
          />
        );
      },
    })),
    {
      key: "termGrade",
      label: "Grade",
      width: 70,
      render: (student) => (
        student.grade ? (
          <div className="flex items-center justify-center gap-1">
            <span className={cn("text-[11px] font-bold tabular-nums", gradeColor(student.grade.final_score))}>
              {fmt(student.grade.final_score)}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground leading-none">
              {student.grade.final_grade}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-[11px]">—</span>
        )
      ),
    },
    ],
    [
      allAssessments,
      manualCats,
      scoresByStudent,
      breakdownByStudent,
      classId,
      saving,
      isLocked,
      onManualCommit,
      onRefresh,
      overrideMutation,
    ]
  );

  if (students.length === 0) return <EmptyState />;

  return <ExcelTable columns={columns} data={students} />;
}

export const DefaultGradeTable = memo(DefaultGradeTableInner);
