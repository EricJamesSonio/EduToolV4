export interface Course {
  id: string;
  org_id: string;
  program_id: string;
  name: string;
  code: string | null;
}

export interface CreateCourseDto {
  schoolYearId: string;
  programId: string;
  name: string;
  code?: string;
}

export interface UpdateCourseDto {
  name?: string;
  code?: string;
}
