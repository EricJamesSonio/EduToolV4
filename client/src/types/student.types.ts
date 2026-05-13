export type StudentStatus =
  | 'active'
  | 'pending'
  | 'dropped'
  | 'transferred'
  | 'suspended'
  | 'graduated';

export interface Student {
  id: string;
  orgId: string;
  email: string;
  status: StudentStatus;
  fullName: string | null;
  studentId: string | null;
  levelId: string | null;
  sectionId: string | null;
  createdAt: string;
  personalEmail: string | null;
}

export interface StudentQueryParams {
  search?: string;
  status?: StudentStatus;
  schoolYearId?: string;
  programId?: string;
  courseId?: string;
  strandId?: string;
  levelId?: string;
  sectionId?: string;
}

export interface CreateStudentDto {
  fullName: string;
  email: string;
  studentId: string;
  levelId?: string;
  sectionId?: string;
}

export interface UpdateStudentDto {
  fullName?: string;
  email?: string;
  levelId?: string;
  sectionId?: string;
}

export interface UpdateStudentStatusDto {
  status: StudentStatus;
  reason?: string;
}

export interface StudentWithPassword extends Student {
  plainPassword: string;
}

export interface ResetStudentPasswordResponse {
  id: string;
  plainPassword: string;
}
