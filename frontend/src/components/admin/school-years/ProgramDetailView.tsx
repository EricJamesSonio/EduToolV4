"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, GraduationCap } from "lucide-react";

import { levelApi }   from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";

import { CoursesSection } from "@/components/admin/program/CoursesSection";
import { StrandsSection } from "@/components/admin/program/StrandsSection";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn }       from "@/lib/utils";

import { LevelWithSectionsList } from "./LevelWithSectionsList";
import { SubjectsSection }       from "./SubjectsSection";

interface ProgramDetailViewProps {
  program:      Program;
  schoolYearId: string;
  isEnded:      boolean;
  onBack:       () => void;
}

export function ProgramDetailView({
  program,
  schoolYearId,
  isEnded,
  onBack,
}: ProgramDetailViewProps): React.JSX.Element {
  const showCourses = program.type === "college";
  const showStrands = program.type === "shs";
  const typeLabel   = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
  const typeColor   = PROGRAM_TYPE_COLORS[program.type] ?? "";

  // Fetch fresh program so courses/strands are current
  const { data: freshProgram } = useQuery({
    queryKey: ["admin", "program", program.id],
    queryFn:  () => programApi.getOne(program.id),
  });

  // Fetch all levels for this school year (SubjectsSection filters by program)
  const { data: allLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const activeProgram = freshProgram ?? program;

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Programs
      </button>

      {/* Program header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0 mt-0.5">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{activeProgram.name}</h2>
          <Badge className={cn("text-xs border", typeColor)}>{typeLabel}</Badge>
        </div>
      </div>

      {/* Levels + Sections */}
      <LevelWithSectionsList
        schoolYearId={schoolYearId}
        programId={program.id}
        isEnded={isEnded}
      />

      {/* Courses (college only) */}
      {showCourses && (
        <CoursesSection
          programId={activeProgram.id}
          schoolYearId={schoolYearId}
          courses={activeProgram.courses ?? []}
        />
      )}

      {/* Strands (SHS only) */}
      {showStrands && (
        <StrandsSection
          programId={activeProgram.id}
          schoolYearId={schoolYearId}
          strands={activeProgram.strands ?? []}
        />
      )}

      {/* Subjects */}
      {levelsLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : (
        <SubjectsSection
          program={activeProgram}
          schoolYearId={schoolYearId}
          levels={allLevels}
          isEnded={isEnded}
        />
      )}
    </div>
  );
}