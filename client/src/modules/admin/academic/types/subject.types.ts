export interface Subject {
  id: string;
  orgId: string;
  title: string;
  subjectType: 'major' | 'minor';
  programId: string | null;
  programName: string | null;
  programType: string | null;
  realProgramId: string | null;
  levelId: string | null;
  levelName: string | null;
  courseId: string | null;
  strandId: string | null;
  lockStatus: 'locked' | 'unlocked';
  yearLevel: string | null;
  termLabel: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface QuerySubjectParams {
  schoolYearId?: string;
  programId?: string;
  levelId?: string;
  search?: string;
  courseId?: string;
  strandId?: string;
  scope?: 'open' | 'coupled';
  yearLevel?: string;
  termLabel?: string;
  subjectType?: 'major' | 'minor';
}