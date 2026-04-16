"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers } from "lucide-react";

import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";

import type { Level } from "@/types/admin/level.types";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import { useQuery } from "@tanstack/react-query";

import { useSchoolYearLevels } from "@/hooks/admin/useSchoolYearLevels";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { LevelList } from "./levels/LevelList";
import { CourseGroupBlock, StrandGroupBlock } from "./levels/GroupBlock";

interface Props {
  schoolYearId: string;
  programId: string;
  isEnded: boolean;
  onViewSubjects?: (levelId: string) => void;
}

export function LevelWithSectionsList({
  schoolYearId,
  programId,
  isEnded,
  onViewSubjects,
}: Props) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => programApi.getOne(programId),
  });

  const { data: allLevels = [], isLoading } =
    useSchoolYearLevels(schoolYearId);

  // 🔥 SINGLE FILTER ONLY HERE
  const levels = allLevels.filter(
    (l) => l.program_id === programId
  );

  const isCollege = program?.type === "college";
  const isSHS = program?.type === "shs";

  const courses: CourseSnapshot[] = program?.courses ?? [];
  const strands: StrandSnapshot[] = program?.strands ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["school-year-levels", schoolYearId],
    });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      levelApi.create({ programId, name, schoolYearId }),
    onSuccess: () => {
      toast.success("Level added");
      invalidate();
    },
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) =>
      levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: () => {
      toast.success("Levels generated");
      invalidate();
    },
  });

  if (isLoading || !program) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const sharedProps = {
    schoolYearId,
    isEnded,
    programType: program.type,
    onViewSubjects,
    onRename: (id: string, name: string) =>
      levelApi.updateOne(id, name),
    onDelete: (level: Level) => setDeleteTarget(level),
    onAdd: () =>
      createMutation.mutate(`Level ${levels.length + 1}`),
    onGenerate: (count: number) =>
      generateMutation.mutate(count),
    isUpdating: false,
    isAdding: createMutation.isPending,
    isGenerating: generateMutation.isPending,
    updatingId: null,
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-semibold">
            Levels & Sections
          </span>
          <Badge>{levels.length}</Badge>
        </div>

        {!isCollege && !isSHS && (
          <LevelList levels={levels} {...sharedProps} />
        )}

        {isCollege &&
          courses.map((course) => (
            <CourseGroupBlock
              key={course.id}
              course={course}
              {...sharedProps}
            />
          ))}

        {isSHS &&
          strands.map((strand) => (
            <StrandGroupBlock
              key={strand.id}
              strand={strand}
              {...sharedProps}
            />
          ))}
      </div>
    </>
  );
}