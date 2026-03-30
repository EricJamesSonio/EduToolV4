export type ClassStatus = "active" | "archived";

export interface ClassSchedule {
  id: string;
  classId: string;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export type EnrollmentStatus = "active" | "pending" | "removed";

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  studentName?: string;
  studentIdNumber?: string;
  status: EnrollmentStatus;
  enrolledAt?: string;
}

export interface Class {
  id: string;
  orgId: string;
  subjectId: string;
  subjectName?: string;     // joined field from backend response
  sectionId: string | null;
  sectionName?: string;     // joined field
  semesterId: string;
  semesterName?: string;    // joined field
  schoolYearId: string;
  schoolYearTitle?: string; // joined field
  educatorId: string;
  educatorName?: string;    // joined field
  capacity: number;
  enrolledCount: number;
  status: ClassStatus;
  schedules: ClassSchedule[];
  createdAt: string;
  updatedAt?: string;
}