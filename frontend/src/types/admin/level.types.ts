export interface Level {
  id: string;
  org_id: string;
  program_id: string;
  school_year_id: string; // was: string | null — now required (schema made it non-nullable)
  name: string;
}

export type LevelDefault = Level;
export type SchoolYearLevel = Level;