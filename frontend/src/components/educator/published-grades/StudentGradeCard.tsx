"use client"

import { Lock, Award, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TermGrades } from "@/types/educator/grade.types"
import type { GradingScale } from "@/types/admin/grading-scale.types"

function fmt(n: number | null, decimals = 1): string {
  if (n === null) return "\u2014"
  return n.toFixed(decimals)
}

export function StudentGradeCard({
  studentId,
  studentName,
  studentCode,
  terms,
  gradingScale,
}: {
  studentId: string
  studentName: string
  studentCode: string
  terms: TermGrades[]
  gradingScale: GradingScale | null
}) {
  const studentTerms = terms
    .map((t) => {
      const student = t.students.find((s) => s.studentId === studentId)
      if (!student) return null
      return {
        termId: t.termId,
        termName: t.termName,
        student,
      }
    })
    .filter(Boolean) as {
    termId: string
    termName: string
    student: NonNullable<(typeof terms)[number]["students"][number]>
  }[]

  const finalScore = studentTerms[studentTerms.length - 1]?.student.grade?.final_score ?? null
  const finalGrade = studentTerms[studentTerms.length - 1]?.student.grade?.final_grade ?? null

  return (
    <div className="space-y-4">
      {/* Student header */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{studentName}</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {studentCode}
            </p>
          </div>
          {finalScore !== null && (
            <div className="ml-auto text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums">{fmt(finalScore, 1)}%</p>
              {finalGrade && (
                <Badge variant="secondary" className="text-xs font-mono mt-0.5">
                  {finalGrade}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Term cards */}
      <div className="space-y-3">
        {studentTerms.map(({ termId, termName, student }) => {
          const grade = student.grade
          const isTermLocked = grade?.is_locked ?? false

          return (
            <div
              key={termId}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{termName}</h3>
                </div>
                {isTermLocked && (
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <Lock className="h-3 w-3" />
                    Published
                  </Badge>
                )}
              </div>

              <div className="p-5">
                {grade ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Final Score</p>
                      <p className="text-lg font-bold tabular-nums mt-1">
                        {fmt(grade.final_score)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Grade</p>
                      <p className="text-lg font-bold mt-1">{grade.final_grade || "\u2014"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No grade computed for this term.
                  </p>
                )}

                {/* Category breakdown */}
                {student.categoryBreakdown.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Category Breakdown
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {student.categoryBreakdown.map((cat) => (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                        >
                          <span className="text-sm capitalize">{cat.category}</span>
                          <div className="text-right">
                            {cat.isAllExempted ? (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                Exempted
                              </Badge>
                            ) : (
                              <>
                                <span className="text-sm font-semibold tabular-nums">
                                  {fmt(cat.rawAverage)}%
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  (w{fmt(cat.weightedScore)})
                                </span>
                                {cat.effectiveWeight != null && Math.abs(cat.effectiveWeight - cat.weight * 100) > 0.01 && (
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                                    redistributed: {fmt(cat.effectiveWeight, 1)}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grading scale reference */}
      {gradingScale && gradingScale.ranges.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
            <Award className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              {gradingScale.name}
            </h3>
          </div>
          <div className="p-4">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {[...gradingScale.ranges]
                .sort((a, b) => b.minPercent - a.minPercent)
                .map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{r.gradeValue}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.minPercent}–{r.maxPercent}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
