export interface AnalyticsOverview {
  totalStudents: number;
  totalEducators: number;
  activeClasses: number;
  pendingStudents: number;
}

export interface EnrollmentBreakdownRow {
  levelSection: string;
  programName: string;
  gradeLevel: string;
  sectionName: string;
  activeCount: number;
  pendingCount: number;
  totalCount: number;
}

export interface GradeDistributionEntry {
  termName: string;
  semesterName: string;
  passed: number;
  failed: number;
  average: number;
}

export interface PendingLockClass {
  classId: string;
  classTitle: string;
  educatorName: string;
  deadline: string;
}