export interface Term {
  id: string;
  name: string;
  orderIndex: number;
  startDate: string;
  endDate: string;
}

export interface Semester {
  id: string;
  schoolYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  terms: Term[];
}

export interface SemesterTemplate {
  id: string;
  orgId: string;
  name: string;
  semesters: Semester[];
  usedByCount: number;
  createdAt: string;
  updatedAt: string;
}