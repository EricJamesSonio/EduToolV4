// Unified Level type using camelCase to match backend response shape
export interface Level {
  id: string;
  orgId: string;
  programId: string;
  name: string;
  schoolYearId?: string | null;
}

// Alias types for semantic clarity
export type LevelDefault = Level;
export type SchoolYearLevel = Level;