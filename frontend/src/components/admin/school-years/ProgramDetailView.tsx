"use client";

import { useState } from "react";
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
  const isCollege = program.type === "college";
  const isSHS     = program.type === "shs";
  // Programs with sub-groups: subjects are managed in Subjects tab with course/strand filters
  // Programs without sub-groups: "View Subjects" button on each level row drives the Subjects tab
  const hasSubGroups = isCollege || isSHS;

  const typeLabel = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
  const typeColor = PROGRAM_TYPE_COLORS[program.type] ?? "";

  // Inner tab state
  const [activeTab,      setActiveTab]      = useState<ProgramDetailTab>("levels");
  // levelId pre-selected when coming from "View Subjects" on a level row
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

  // Called by LevelWithSectionsList when user clicks "View Subjects" on a level
  const handleViewSubjects = (levelId: string) => {
    setSubjectLevelId(levelId);
    setActiveTab("subjects");
  };

  // Build inner tab list dynamically based on program type
  const tabs: { key: ProgramDetailTab; label: string }[] = [
    { key: "levels",   label: "Levels & Sections" },
    ...(isCollege ? [{ key: "courses" as ProgramDetailTab, label: "Courses" }]  : []),
    ...(isSHS     ? [{ key: "strands" as ProgramDetailTab, label: "Strands" }]  : []),
    { key: "subjects", label: "Subjects" },
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
        {/* Levels & Sections */}
        {activeTab === "levels" && (
          <LevelWithSectionsList
            schoolYearId={schoolYearId}
            programId={program.id}
            isEnded={isEnded}
            // Only pass the shortcut for programs without courses/strands
            onViewSubjects={!hasSubGroups ? handleViewSubjects : undefined}
          />
        )}

        {/* Courses (college only) */}
        {activeTab === "courses" && isCollege && (
          <CoursesSection
            programId={activeProgram.id}
            schoolYearId={schoolYearId}
            courses={activeProgram.courses ?? []}
          />
        )}

        {/* Strands (SHS only) */}
        {activeTab === "strands" && isSHS && (
          <StrandsSection
            programId={activeProgram.id}
            schoolYearId={schoolYearId}
            strands={activeProgram.strands ?? []}
          />
        )}

        {/* Subjects */}
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
      </div>
    </div>
  );
}