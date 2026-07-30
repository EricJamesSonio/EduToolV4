// frontend\src\components\admin\school-years\ProgramDetailView.tsx
"use client";

import { useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

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
import { useEnrollmentDrilldown } from "@/components/admin/school-years/hooks/useEnrollmentDrilldown";
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

  // ← swap useState for URL-based tab
  const { state, selectProgramTab } = useEnrollmentDrilldown();
  const activeTab = (state.programTab ?? "levels") as ProgramDetailTab;

  // subjectLevelId still needs local state — it's transient UI only
  const [subjectLevelId, setSubjectLevelId] = useState<string | undefined>(undefined);

  const { data: freshProgram } = useAsyncQuery(
    queryKeys.admin.programs.detail(program.id),
    () => programApi.getOne(program.id),
  );

  const { data: allLevels = [], isLoading: levelsLoading } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId }),
    () => levelApi.getBySchoolYear(schoolYearId),
  );

  const activeProgram = freshProgram ?? program;

  const handleViewSubjects = (levelId: string) => {
    setSubjectLevelId(levelId);
    selectProgramTab("subjects"); // ← writes to URL
  };

  const tabs: { key: ProgramDetailTab; label: string }[] = [
    { key: "levels",     label: "Levels & Sections" },
    ...(isCollege ? [{ key: "courses"  as ProgramDetailTab, label: "Courses" }] : []),
    ...(isSHS     ? [{ key: "strands"  as ProgramDetailTab, label: "Strands" }] : []),
    { key: "subjects",   label: "Subjects" },
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
        <div className="icon-container icon-edu shrink-0 mt-0.5">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold not-interactive">{activeProgram.name}</h2>
          <Badge className={cn("text-xs border", typeColor)}>{typeLabel}</Badge>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="border-b flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => selectProgramTab(tab.key)} // ← writes to URL
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
      </div>
    </div>
  );
}