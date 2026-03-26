export interface Term {
  id: string;
  name: string;
  order: number;
}

export interface Semester {
  id: string;
  templateId: string;
  name: string;
  startDate: string;
  endDate: string;
  order: number;
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