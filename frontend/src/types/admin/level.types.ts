export interface Level {
  id: string;
  org_id: string;
  program_id: string;
  course_id?: string;
  strand_id?: string;
  school_year_id: string;
  name: string;
}

export type LevelDefault = Level;
export type SchoolYearLevel = Level;