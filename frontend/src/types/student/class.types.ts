// Already exists in the project — shown here for reference only
// frontend/src/types/student/class.types.ts

export interface StudentClass {
  id: string;
  subjectName: string;
  subjectCode?: string;
  className: string;
  educatorName: string;
  schedule: string;          // e.g. "Mon / Wed / Fri  7:30 – 9:00 AM"
  semesterName: string;
  termName?: string;         // e.g. "1st Quarter" or "Midterm"
  schoolYear?: string;
  status?: "active" | "completed" | "upcoming";
}

export interface StudentClassesResponse {
  data: StudentClass[];
  total: number;
}