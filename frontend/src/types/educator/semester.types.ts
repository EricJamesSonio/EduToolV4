// filepath: frontend/src/types/educator/semester.types.ts

export interface EducatorTerm {
  id: string;
  semester_id: string;
  org_id: string;
  name: string;
  order_index: number;
  start_date: string;
  end_date: string;
}

export interface EducatorSemester {
  id: string;
  org_id: string;
  school_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  terms: EducatorTerm[];
}