"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

import { programApi } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";

import { ProgramDetailView } from "./ProgramDetailView";

interface ProgramsTabProps {
  schoolYearId: string;
  isEnded:      boolean;
}

export function ProgramsTab({
  schoolYearId,
  isEnded,
}: ProgramsTabProps): React.JSX.Element {
  const [selected, setSelected] = useState<Program | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId),
  });

  if (selected) {
    return (
      <ProgramDetailView
        program={selected}
        schoolYearId={schoolYearId}
        isEnded={isEnded}
        onBack={() => setSelected(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          No programs for this school year
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add programs from the{" "}
          <Link href="/admin/programs" className="text-primary hover:underline">
            Programs page
          </Link>{" "}
          or run the data seeder from Organization settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((program) => {
        const typeLabel   = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
        const typeColor   = PROGRAM_TYPE_COLORS[program.type] ?? "";
        const courseCount = program.courses?.length ?? 0;
        const strandCount = program.strands?.length ?? 0;

        return (
          <button
            key={program.id}
            onClick={() => setSelected(program)}
            className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{program.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-xs border", typeColor)}>
                      {typeLabel}
                    </Badge>
                    {courseCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {courseCount} {courseCount === 1 ? "course" : "courses"}
                      </span>
                    )}
                    {strandCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {strandCount} {strandCount === 1 ? "strand" : "strands"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}