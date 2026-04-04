// src/app/student/transcript/page.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Printer, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { useTranscript } from "@/hooks/student/useTranscript";
import type { TranscriptYear, TranscriptSemester, TranscriptClass } from "@/api/student/transcript.api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeStatusBadge(isReleased: boolean, finalGrade: string | null) {
  if (!isReleased) {
    return (
      <Badge variant="outline" className="text-[11px] text-muted-foreground border-border/60">
        Pending
      </Badge>
    );
  }
  if (!finalGrade) {
    return (
      <Badge variant="outline" className="text-[11px] text-muted-foreground border-border/60">
        —
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] font-semibold text-foreground border-border/80">
      {finalGrade}
    </Badge>
  );
}

function schoolYearStatusBadge(status: string) {
  const map: Record<string, string> = {
    active:    "bg-green-50 text-green-700 border-green-200",
    completed: "bg-muted text-muted-foreground border-border/60",
    upcoming:  "bg-blue-50 text-blue-700 border-blue-200",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border/60";
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium capitalize shrink-0", cls)}>
      {status}
    </Badge>
  );
}

// ── SubjectRow ────────────────────────────────────────────────────────────────

function SubjectRows({ cls }: { cls: TranscriptClass }) {
  const sorted = [...cls.termGrades].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <>
      {sorted.map((tg, i) => (
        <tr key={tg.termId} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
          {/* Subject name — only on first term row */}
          {i === 0 ? (
            <td
              className="px-4 py-2.5 text-sm font-medium text-foreground align-top"
              rowSpan={sorted.length}
            >
              {cls.subject.name}
            </td>
          ) : null}
          <td className="px-4 py-2.5 text-sm text-muted-foreground">{tg.termName}</td>
          <td className="px-4 py-2.5 text-sm text-center">
            {tg.isReleased && tg.finalScore != null ? (
              <span className="font-medium tabular-nums">{tg.finalScore.toFixed(2)}</span>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </td>
          <td className="px-4 py-2.5 text-center">
            {gradeStatusBadge(tg.isReleased, tg.finalGrade)}
          </td>
        </tr>
      ))}
    </>
  );
}

// ── SemesterSection ───────────────────────────────────────────────────────────

function SemesterSection({ semester }: { semester: TranscriptSemester }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-1">
        {semester.semesterName}
      </p>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border/60">
              <th className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[35%]">
                Subject
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[25%]">
                Term
              </th>
              <th className="px-4 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">
                Score
              </th>
              <th className="px-4 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {semester.classes.map((cls) => (
              <SubjectRows key={cls.classId} cls={cls} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SchoolYearAccordion ───────────────────────────────────────────────────────

function SchoolYearAccordion({ year }: { year: TranscriptYear }) {
  const [open, setOpen] = useState(year.schoolYearStatus === "active");

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="shrink-0 text-muted-foreground">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">
          {year.schoolYearName}
        </span>
        {schoolYearStatusBadge(year.schoolYearStatus)}
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-border/60 px-5 py-4 space-y-5">
          {year.semesters.map((sem) => (
            <SemesterSection key={sem.semesterId} semester={sem} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function TranscriptSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border/60 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          </div>
          <div className="space-y-2 pt-1">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentTranscriptPage(): React.JSX.Element {
  const { data: years = [], isLoading } = useTranscript();

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Transcript" />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-1.5 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
      </div>

      {isLoading ? (
        <TranscriptSkeleton />
      ) : years.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No transcript data available</p>
        </div>
      ) : (
        <div className="space-y-3 print:space-y-4">
          {years.map((year) => (
            <SchoolYearAccordion key={year.schoolYearId} year={year} />
          ))}
        </div>
      )}
    </div>
  );
}