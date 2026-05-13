export interface Level {
  id: string;
  org_id: string;
  program_id: string;
  school_year_id: string;
  name: string;
}

export interface CreateLevelDto {
  programId: string;
  name: string;
  schoolYearId: string;
}

export interface UpdateLevelDto {
  name: string;
}

export interface LevelDefault extends Level {}
