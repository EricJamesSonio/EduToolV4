"use client"

import { Lock, Unlock, Award, TrendingUp, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WEEK_COLORS } from "@/lib/palette"
import { cn } from "@/lib/utils"
import type { TermGrades } from "@/types/educator/grade.types"
import type { GradingScale } from "@/types/admin/grading-scale.types"

function fmt(n: number | null, decimals = 1): string {
  if (n === null) return "\u2014"
  return n.toFixed(decimals)
}

function gradeColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 90) return "text-success dark:text-success"
  if (score >= 75) return "text-info dark:text-info"
  if (score >= 60) return "text-warning dark:text-warning"
  return "text-destructive"
}

export function StudentGradeCard({
  studentId,
  studentName,
  studentCode,
  terms,
  gradingScale,
  onPublishTerm,
  onUnlockTerm,
  onPublishAllTerms,
  isPublishing,
}: {
  studentId: string
  studentName: string
  studentCode: string
  terms: TermGrades[]
  gradingScale: GradingScale | null
  onPublishTerm?: (termId: string, studentId: string) => void
  onUnlockTerm?: (termId: string, studentId: string) => void
  onPublishAllTerms?: (studentId: string) => void
  isPublishing?: boolean
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

  const scores = studentTerms
    .map((t) => t.student.grade?.final_score)
    .filter((s): s is number => s !== null && s !== undefined)

  const overallAverage =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null

  const finalScore = studentTerms[studentTerms.length - 1]?.student.grade?.final_score ?? null
  const finalGrade = studentTerms[studentTerms.length - 1]?.student.grade?.final_grade ?? null

  const allPublished = studentTerms.every((t) => t.student.grade?.is_locked)

  return (
    <div className="space-y-4">
      {/* Student header */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#BFDBFE] border border-[#93C5FD] flex items-center justify-center text-lg font-bold text-[#0B1E3A] shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{studentName}</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {studentCode}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!allPublished && onPublishAllTerms && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onPublishAllTerms(studentId)}
                disabled={isPublishing}
                className="gap-1.5"
              >
                {isPublishing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Lock className="h-3.5 w-3.5" />
                }
                Publish All Terms
              </Button>
            )}
            {scores.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Overall Average</p>
                <p className={gradeColor(overallAverage) + " text-2xl font-bold tabular-nums"}>
                  {fmt(overallAverage, 1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Term cards */}
      <div className="space-y-3">
        {studentTerms.map(({ termId, termName, student }, idx) => {
          const grade = student.grade
          const isTermLocked = grade?.is_locked ?? false
          const termScore = grade?.final_score ?? null
          const termColor = WEEK_COLORS[idx % WEEK_COLORS.length]

          return (
            <div
              key={termId}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className={termColor + " flex items-center justify-between px-5 py-3 border-b"}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">{termName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isTermLocked ? (
                    <Badge variant="outline" className="gap-1 text-[11px] bg-background">
                      <Lock className="h-3 w-3" />
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-[11px] text-warning border-warning/30 bg-background">
                      Draft
                    </Badge>
                  )}
                  {isTermLocked ? (
                    onUnlockTerm && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUnlockTerm(termId, studentId)}
                        disabled={isPublishing}
                        className="gap-1 h-7 text-[11px] bg-background"
                      >
                        {isPublishing
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Unlock className="h-3 w-3" />
                        }
                        Unpublish
                      </Button>
                    )
                  ) : (
                    onPublishTerm && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onPublishTerm(termId, studentId)}
                        disabled={isPublishing}
                        className="gap-1 h-7 text-[11px]"
                      >
                        {isPublishing
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Lock className="h-3 w-3" />
                        }
                        Publish
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="p-5">
                {grade ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Final Score</p>
                      <p className={`text-lg font-bold tabular-nums mt-1 ${gradeColor(termScore)}`}>
                        {fmt(termScore)}
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
                      {student.categoryBreakdown.map((cat, ci) => {
                        const catColor = WEEK_COLORS[ci % WEEK_COLORS.length]
                        return (
                          <div
                            key={cat.category}
                            className={cn("flex items-center justify-between rounded-lg border px-3 py-2", catColor)}
                          >
                            <span className="text-sm capitalize">{cat.category}</span>
                            <div className="text-right">
                              {cat.isAllExempted ? (
                                <Badge variant="outline" className="text-xs text-warning border-warning/30">
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
                        )
                      })}
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
