import type { StudentGrade } from "@/types/educator/grade.types";
import { fmt } from "./utils";

export function StatsBar({ students }: { students: StudentGrade[] }) {
  const graded = students.filter((s) => s.grade !== null).length;
  const locked = students.filter((s) => s.grade?.is_locked).length;
  const avg =
    graded > 0
      ? students
          .filter((s) => s.grade !== null)
          .reduce((sum, s) => sum + (s.grade!.final_score ?? 0), 0) / graded
      : null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Students", value: students.length },
        { label: "Graded", value: `${graded}/${students.length}` },
        { label: "Class Average", value: avg !== null ? `${fmt(avg)}%` : "—" },
      ].map((stat) => (
        <div key={stat.label} className="rounded-lg border bg-card px-4 py-3">
          <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
