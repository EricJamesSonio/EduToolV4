export interface AnalyticsOverview {
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  totalEducators: number;
  totalClasses: number; // was activeClasses
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

export interface AnalyticsRangeParams {
  schoolYearId?: string;
  startDate?: string;
  endDate?: string;
}

export type EnrollmentTimelineInterval = "day" | "week" | "month";

export interface EnrollmentTimelinePoint {
  bucket: string;
  active: number;
  pending: number;
  unenrolled: number;
  total: number;
}

export interface EnrollmentTimeline {
  interval: EnrollmentTimelineInterval;
  points: EnrollmentTimelinePoint[];
  totals: {
    active: number;
    pending: number;
    unenrolled: number;
    total: number;
  };
}

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
}

export interface EnrollmentDistribution {
  studentStatus: DonutSlice[];
  programs: DonutSlice[];
  sectionAssignment: DonutSlice[];
}