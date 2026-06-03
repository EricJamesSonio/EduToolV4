"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { ExcelTable, ExcelColumn } from "@/components/shared/ExcelTable";
import { cn } from "@/lib/utils";
import type { TermGrades, StudentGrade } from "@/types/educator/grade.types";
import { EmptyState } from "./EmptyState";
import { ManualCell } from "./ManualCell";
import { StudentCategoryDrillDown } from "./StudentCategoryDrillDown";
import { gradeColor, fmt } from "./utils";

export function CleanGradeTable({
  termData,
  onManualCommit,
  isLocked,
}: {
  termData: TermGrades;
  onManualCommit: (studentId: string, category: string, value: number) => void;
  isLocked: boolean;
}) {
  const { students } = termData;
  const [drillDown, setDrillDown] = useState<{ student: StudentGrade; category: string } | null>(null);
  if (students.length === 0) return <EmptyState />;

  const allCategories = Array.from(
    new Set(students.flatMap((s) => s.categoryBreakdown.map((c) => c.category)))
  ).filter((cat) => {
    return students.some((s) => {
      const bd = s.categoryBreakdown.find((c) => c.category === cat);
      return bd?.type !== 'manual' || bd?.manualScore != null;
    });
  });

  const columns: ExcelColumn<StudentGrade>[] = [
    {
      key: "student",
      label: "Student",
      width: 200,
      sticky: true,
      render: (student) => (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
              {student.studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-medium truncate text-[11px]">{student.studentName}</p>
              <p className="text-[9px] text-muted-foreground font-mono leading-none">{student.studentCode}</p>
            </div>
            {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
          </div>
        ),
      },
    ...allCategories.map((cat) => ({
      key: cat,
      label: cat,
      width: 85,
      render: (student: StudentGrade) => {
        const bd = student.categoryBreakdown.find(
          (c) => c.category.toLowerCase() === cat.toLowerCase()
        );
        const isManual = bd?.manualScore !== undefined && bd?.manualScore !== null;
        if (isManual) {
          return (
            <ManualCell
              value={bd?.manualScore ?? null}
              studentId={student.studentId}
              category={cat}
              isLocked={isLocked}
              onCommit={onManualCommit}
              compact
            />
          );
        }
        return (
          <span
            onClick={() => setDrillDown({ student, category: cat })}
            className="cursor-pointer underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 text-[11px] tabular-nums text-foreground"
          >
            {bd ? `${fmt(bd.rawAverage)}` : "—"}
          </span>
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
  ];

  return (
    <>
      <ExcelTable columns={columns} data={students} />
      <StudentCategoryDrillDown
        student={drillDown?.student ?? null}
        category={drillDown?.category ?? null}
        onClose={() => setDrillDown(null)}
      />
    </>
  );
}
