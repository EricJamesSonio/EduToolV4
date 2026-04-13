import type { Level } from "@/types/admin/level.types";

export interface LevelListSharedProps {
  schoolYearId:    string;
  isEnded:         boolean;
  programType:     string;
  onViewSubjects?: (levelId: string) => void;
  onRename:        (id: string, name: string) => void;
  onDelete:        (level: Level) => void;
  onAdd:           () => void;
  onGenerate:      (count: number) => void;
  isUpdating:      boolean;
  isAdding:        boolean;
  isGenerating:    boolean;
  updatingId:      string | null;
}