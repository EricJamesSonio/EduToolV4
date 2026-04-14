"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { levelApi }   from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import { CoursesSection }        from "@/components/admin/program/CoursesSection";
import { StrandsSection }        from "@/components/admin/program/StrandsSection";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn }       from "@/lib/utils";
import { LevelWithSectionsList } from "./LevelWithSectionsList";
import { SubjectsSection }       from "./SubjectsSection";
import { ProgramEnrollmentView } from "./ProgramEnrollmentView";
import type { ProgramDetailTab } from "./constants";

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
  const isCollege    = program.type === "college";
  const isSHS        = program.type === "shs";
  const hasSubGroups = isCollege || isSHS;

  const typeLabel = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
  const typeColor = PROGRAM_TYPE_COLORS[program.type] ?? "";

  const [activeTab,      setActiveTab]      = useState<ProgramDetailTab>("levels");
  const [subjectLevelId, setSubjectLevelId] = useState<string | undefined>(undefined);

  const { data: freshProgram } = useQuery({
    queryKey: ["admin", "program", program.id],
    queryFn:  () => programApi.getOne(program.id),
  });

  const { data: allLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const activeProgram = freshProgram ?? program;

  const handleViewSubjects = (levelId: string) => {
    setSubjectLevelId(levelId);
    setActiveTab("subjects");
  };

  const tabs: { key: ProgramDetailTab; label: string }[] = [
    { key: "levels",     label: "Levels & Sections" },
    ...(isCollege ? [{ key: "courses"    as ProgramDetailTab, label: "Courses"    }] : []),
    ...(isSHS     ? [{ key: "strands"    as ProgramDetailTab, label: "Strands"    }] : []),
    { key: "subjects",   label: "Subjects" },
    { key: "enrollment", label: "Enrollment" },
  ];

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

      {/* Inner tabs */}
      <div className="border-b flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "levels" && (
          <LevelWithSectionsList
            schoolYearId={schoolYearId}
            programId={program.id}
            isEnded={isEnded}
            onViewSubjects={!hasSubGroups ? handleViewSubjects : undefined}
          />
        )}

        {activeTab === "courses" && isCollege && (
          <CoursesSection
            program={activeProgram}
            schoolYearId={schoolYearId}
            courses={activeProgram.courses ?? []}
            isEnded={isEnded}
          />
        )}

        {activeTab === "strands" && isSHS && (
          <StrandsSection
            program={activeProgram}
            schoolYearId={schoolYearId}
            strands={activeProgram.strands ?? []}
            isEnded={isEnded}
          />
        )}

        {activeTab === "subjects" && (
          levelsLoading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <SubjectsSection
              program={activeProgram}
              schoolYearId={schoolYearId}
              levels={allLevels}
              isEnded={isEnded}
              initialLevelId={subjectLevelId}
            />
          )
        )}

        {activeTab === "enrollment" && (
          levelsLoading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <ProgramEnrollmentView
              program={activeProgram}
              schoolYearId={schoolYearId}
              levels={allLevels}
              isEnded={isEnded}
            />
          )
        )}
      </div>
    </div>
  );
}