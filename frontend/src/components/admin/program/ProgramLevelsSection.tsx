"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { levelApi } from "@/api/admin/level.api";
import { LevelList } from "@/components/admin/school-years/levels/LevelList";
import type { Level } from "@/types/admin/level.types";

interface ProgramLevelsSectionProps {
  programId: string;
  schoolYearId: string;
  programType: string;
}

export function ProgramLevelsSection({
  programId,
  schoolYearId,
  programType,
}: ProgramLevelsSectionProps) {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryKey = ["school-year-levels", schoolYearId];

  const { data: allLevels = [], isLoading } = useQuery<Level[]>({
    queryKey,
    queryFn: async () => {
      const res = await levelApi.getBySchoolYear(schoolYearId);
      return res.data ?? res;
    },
    staleTime: 1000 * 60 * 5,
  });

  const levels = allLevels.filter((l) => l.program_id === programId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (name: string) => levelApi.create({ programId, name, schoolYearId }),
    onSuccess: invalidate,
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) => levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => levelApi.updateOne(id, name),
    onSuccess: () => { setUpdatingId(null); invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="card-landing p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Levels</h3>
        </div>
        <p className="text-xs text-muted-foreground py-2">Loading levels...</p>
      </div>
    );
  }

  return (
    <div className="card-landing">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Levels</h3>
        <span className="text-xs text-muted-foreground ml-auto">{levels.length} level{levels.length !== 1 ? "s" : ""}</span>
      </div>
      <LevelList
        levels={levels}
        schoolYearId={schoolYearId}
        isEnded={false}
        programType={programType}
        onRename={(id, name) => { setUpdatingId(id); updateMutation.mutate({ id, name }); }}
        onDelete={(level) => { if (confirm(`Delete level "${level.name}"?`)) deleteMutation.mutate(level.id); }}
        onAdd={() => createMutation.mutate(`Level ${levels.length + 1}`)}
        onGenerate={(count) => generateMutation.mutate(count)}
        isUpdating={updateMutation.isPending}
        isAdding={createMutation.isPending}
        isGenerating={generateMutation.isPending}
        updatingId={updatingId}
      />
    </div>
  );
}
