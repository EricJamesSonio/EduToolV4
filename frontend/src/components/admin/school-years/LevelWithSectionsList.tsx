"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers } from "lucide-react";

import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";

import type { Level } from "@/types/admin/level.types";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { LevelList } from "./levels/LevelList";
import { CourseGroupBlock, StrandGroupBlock } from "./levels/GroupBlock";

interface LevelWithSectionsListProps {
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
}: LevelWithSectionsListProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: program } = useQuery({
    queryKey: ["admin", "program", programId],
    queryFn: () => programApi.getOne(programId),
  });

  const { data: allLevels = [], isLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
  });

  const levels = allLevels.filter((l) => l.program_id === programId || !l.program_id);

  const isCollege = program?.type === "college";
  const isSHS = program?.type === "shs";

  const courses: CourseSnapshot[] = program?.courses ?? [];
  const strands: StrandSnapshot[] = program?.strands ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.updateOne(id, name),
    onSuccess: () => {
      toast.success("Level renamed.");
      invalidate();
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      levelApi.create({ programId, name, schoolYearId }),
    onSuccess: () => {
      toast.success("Level added.");
      invalidate();
    },
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) =>
      levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: () => {
      toast.success("Levels generated.");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: () => {
      toast.success("Level deleted.");
      invalidate();
      setDeleteTarget(null);
    },
  });

  if (isLoading || !program) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
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
      updateMutation.mutate({ id, name }),
    onDelete: (level: Level) => setDeleteTarget(level),
    onAdd: () =>
      createMutation.mutate(`Level ${levels.length + 1}`),
    onGenerate: (count: number) =>
      generateMutation.mutate(count),
    isUpdating: updateMutation.isPending,
    isAdding: createMutation.isPending,
    isGenerating: generateMutation.isPending,
    updatingId,
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Levels & Sections</span>
          <Badge variant="secondary">{levels.length}</Badge>
        </div>

        {!isCollege && !isSHS && (
          <LevelList levels={levels} {...sharedProps} />
        )}

        {isCollege &&
          (courses.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No courses found.
            </p>
          ) : (
            courses.map((course) => (
              <CourseGroupBlock
                key={course.id}
                course={course}
                {...sharedProps}
              />
            ))
          ))}

        {isSHS &&
          (strands.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No strands found.
            </p>
          ) : (
            strands.map((strand) => (
              <StrandGroupBlock
                key={strand.id}
                strand={strand}
                {...sharedProps}
              />
            ))
          ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"?`}
          confirmLabel="Delete Level"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        />
      )}
    </>
  );
}