"use client";

import { useState } from "react";
import { GraduationCap, Users, BookOpen, Award, ArrowRightLeft, FileText, Clock, History } from "lucide-react";
import { useAcademicTimeline } from "@/hooks/admin/useAcademicHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

interface Props {
  studentId: string;
  schoolYearId?: string;
}

const labelMap: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  academic_enrollment_created: { label: "Enrolled in school year", icon: GraduationCap },
  program_enrollment_created: { label: "Program enrollment", icon: GraduationCap },
  section_assigned: { label: "Section assigned", icon: Users },
  class_enrolled: { label: "Enrolled in class", icon: BookOpen },
  outcome_set: { label: "Outcome set", icon: Award },
  program_shift: { label: "Program shift", icon: ArrowRightLeft },
  assignment_request_created: { label: "Class request", icon: FileText },
  assignment_request_finalized: { label: "Request finalized", icon: FileText },
  assignment_request_reopened: { label: "Request reopened", icon: Clock },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function renderDetails(type: string, data: Record<string, unknown>): React.ReactNode {
  const d = data as Record<string, string | string[] | null | undefined>;
  switch (type) {
    case "academic_enrollment_created":
      return <span className="text-sm">{(d.schoolYearName as string) ?? "School year"}</span>;
    case "program_enrollment_created": {
      const parts = [d.programName, d.levelName, d.courseName, d.strandName].filter(Boolean) as string[];
      return <span className="text-sm font-medium">{parts.join(" · ") || (d.programName as string)}</span>;
    }
    case "section_assigned":
      return <span className="text-sm">{d.sectionName as string} <span className="text-muted-foreground">· {d.programName as string}</span></span>;
    case "class_enrolled":
      return <span className="text-sm font-medium">{d.subjectName as string}</span>;
    case "outcome_set": {
      const outcome = String(d.outcome ?? "").replace(/_/g, " ");
      const badgeVariant = d.outcome === "passed" || d.outcome === "completed" ? "default" : d.outcome === "failed" ? "destructive" : "secondary";
      return (
        <span className="flex items-center gap-2">
          <Badge variant={badgeVariant as never} className="capitalize">{outcome}</Badge>
          <span className="text-sm">{d.subjectName as string}</span>
          {d.outcomeReason ? <span className="text-xs text-muted-foreground">· {String(d.outcomeReason)}</span> : null}
        </span>
      );
    }
    case "program_shift":
      return (
        <span className="text-sm">
          {d.fromProgramName as string} <span className="text-muted-foreground mx-1">→</span> {d.toProgramName as string}
          <Badge variant="outline" className="ml-2 text-xs capitalize">{String(d.defaultOutcomeUsed ?? "").replace(/_/g, " ")}</Badge>
        </span>
      );
    case "assignment_request_created":
      return <span className="text-sm">{((d.subjectNames as string[]) ?? []).join(", ") || "—"} <span className="text-xs text-muted-foreground">· {String(d.origin).replace("_", " ")}</span></span>;
    case "assignment_request_finalized":
      return <span className="text-sm">{((d.subjectNames as string[]) ?? []).join(", ") || "—"}</span>;
    case "assignment_request_reopened":
      return <span className="text-sm text-muted-foreground">Reason: {String(d.reason ?? "—")}</span>;
    default:
      return null;
  }
}

export function AcademicTimeline({ studentId, schoolYearId }: Props): React.JSX.Element {
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const { data, isLoading } = useAcademicTimeline(studentId, schoolYearId, sort);

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  const events = data ?? [];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold leading-none">Academic Timeline</h3>
            <p className="text-xs text-muted-foreground mt-1">{events.length} milestone{events.length !== 1 ? "s" : ""} {schoolYearId ? "· This school year" : "· All years"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSort(sort === "asc" ? "desc" : "asc")}>
          {sort === "asc" ? "Old → New" : "New → Old"}
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No timeline events" description={schoolYearId ? "No milestones for this school year yet." : "No academic history yet."} icon={History} />
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-3">
            {events.map((e, idx) => {
              const meta = labelMap[e.type] ?? { label: e.type, icon: Clock };
              const Icon = meta.icon;
              return (
                <div key={`${e.type}-${e.timestamp}-${idx}`} className="relative flex gap-3">
                  <div className="absolute left-[-19px] h-6 w-6 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center">
                    <Icon className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 ml-2 rounded-lg border bg-card p-3 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.timestamp)}</span>
                    </div>
                    <div className="mt-1.5">{renderDetails(e.type, e.data as Record<string, unknown>)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
