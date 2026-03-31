// frontend/src/types/admin/level.types.ts
export interface Level {
  id: string;
  org_id: string;
  program_id: string;       // ← snake_case, matches Prisma output
  name: string;
  school_year_id?: string | null;
}

export type LevelDefault = Level;
export type SchoolYearLevel = Level;