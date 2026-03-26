import { ClassSchedule } from "@/types/admin/class.types";

export interface StudentClass {
  id: string;
  title: string;
  subjectTitle: string;
  educatorName: string;
  schedule: ClassSchedule;
  semesterName: string;
  termName: string;
  schoolYearTitle: string;
  enrolledCount: number;
}