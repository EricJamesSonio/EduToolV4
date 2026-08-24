"use client";

import { GraduationCap, Users, Layers, BookOpen, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { FullHistorySchoolYear } from "@/types/academic-history.types";

interface Props {
  history: FullHistorySchoolYear[];
}

function ProgramBadge({ status }: { status: string }): React.JSX.Element {
  const variant = status === "active" ? "default" : status === "ended" ? "secondary" : "outline";
  return <Badge variant={variant as never} className="capitalize text-xs">{status}</Badge>;
}

function OutcomeBadge({ outcome }: { outcome: string | null }): React.JSX.Element | null {
  if (!outcome) return <Badge variant="secondary" className="text-xs">Enrolled</Badge>;
  const norm = outcome.replace(/_/g, " ");
  const variant = outcome === "passed" || outcome === "completed" ? "default" : outcome === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant as never} className="capitalize text-xs">{norm}</Badge>;
}

export function AcademicHistoryDetailsView({ history }: Props): React.JSX.Element {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No academic history yet.</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((year) => (
        <Card key={year.studentSchoolYearId} className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold leading-none">{year.schoolYear.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">School year</p>
            </div>
            <Badge variant={year.schoolYear.status === "active" ? "default" : "secondary"} className="ml-auto capitalize text-xs">
              {year.schoolYear.status}
            </Badge>
          </div>

          {year.programEnrollments.length > 0 ? (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Programs</p>
              {year.programEnrollments.map((pe) => (
                <div key={pe.id} className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold">{pe.program.name}</span>
                    <ProgramBadge status={pe.status} />
                    {pe.endReason ? <span className="text-xs text-muted-foreground">· {pe.endReason.replace(/_/g, " ")} </span> : null}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pl-5 text-xs text-muted-foreground">
                    {pe.level ? <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{pe.level.name}</span> : null}
                    {pe.course ? <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{pe.course.code ? `${pe.course.code} – ${pe.course.name}` : pe.course.name}</span> : null}
                    {pe.strand ? <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{pe.strand.name}</span> : null}
                    {pe.section ? <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pe.section.name}</span> : <span className="text-xs italic">No section</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">Not enrolled in any program yet.</p>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Classes</p>
            {year.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {year.enrollments.map((enr) => (
                  <div key={enr.id} className="rounded-lg border bg-card px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{enr.class.subject?.name ?? "Unknown subject"}</span>
                    </div>
                    <OutcomeBadge outcome={enr.outcome} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {year.shiftEvents.length > 0 ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>{year.shiftEvents.length} program shift{year.shiftEvents.length > 1 ? "s" : ""} in this year</span>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
