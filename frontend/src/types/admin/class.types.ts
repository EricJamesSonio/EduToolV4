export type ClassStatus = "active" | "archived";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface ClassSchedule {
  days: Weekday[];
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
}

export type EnrollmentStatus = "active" | "dropped";

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface Class {
  id: string;
  orgId: string;
  title: string;
  subjectId: string;
  subjectTitle: string;
  sectionId: string;
  sectionName: string;
  semesterId: string;
  semesterName: string;
  termId: string;
  termName: string;
  educatorId: string;
  educatorName: string;
  schedule: ClassSchedule;
  capacity: number;
  enrolledCount: number;
  status: ClassStatus;
  schoolYearId: string;
  schoolYearTitle: string;
  createdAt: string;
  updatedAt: string;
}