export type SubjectLockStatus = "unlocked" | "locked";

export interface Subject {
  id: string;
  orgId: string;
  title: string;
  gradeLevel: string;
  programId: string;
  programName: string;
  courseId: string | null;
  courseName: string | null;
  educatorId: string | null;
  educatorName: string | null;
  gradingSystemId: string | null;
  gradingSystemName: string | null;
  lockStatus: SubjectLockStatus;
  createdAt: string;
  updatedAt: string;
}