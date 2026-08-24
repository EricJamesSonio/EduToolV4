import type { ProgramType } from "@/types/admin/program.types";

export interface SchoolProfileSection {
  id: string;
  name: string;
  capacity: number;
}

export interface SchoolProfileSubjectSharing {
  id: string;
  courseId: string | null;
  strandId: string | null;
}

export interface SchoolProfileSubject {
  id: string;
  name: string;
  subjectType: "major" | "minor";
  sharings?: SchoolProfileSubjectSharing[];
}

export interface SchoolProfileLevel {
  id: string;
  courseId: string | null;
  strandId: string | null;
  name: string;
  orderIndex: number;
  sections: SchoolProfileSection[];
  subjects: SchoolProfileSubject[];
}

export interface SchoolProfileCourse {
  id: string;
  name: string;
  code: string | null;
  levels: SchoolProfileLevel[];
}

export interface SchoolProfileStrand {
  id: string;
  name: string;
  levels: SchoolProfileLevel[];
}

export interface SchoolProfileDepartment {
  id: string;
  type: ProgramType;
  courses: SchoolProfileCourse[];
  strands: SchoolProfileStrand[];
  levels: SchoolProfileLevel[]; // department-level (non-course, non-strand) levels
  subjects: SchoolProfileSubject[]; // department-level minor/shared subjects
}

export interface CreateProfileCourseRequest {
  name: string;
  code?: string;
}

export interface UpdateProfileCourseRequest {
  name?: string;
  code?: string;
}

export interface CreateProfileStrandRequest {
  name: string;
}

export interface UpdateProfileStrandRequest {
  name?: string;
}

export interface CreateProfileLevelRequest {
  name: string;
  courseId?: string;
  strandId?: string;
  orderIndex: number;
}

export interface UpdateProfileLevelRequest {
  name?: string;
  orderIndex?: number;
}

export interface CreateProfileSectionRequest {
  name: string;
  capacity: number;
}

export interface UpdateProfileSectionRequest {
  name?: string;
  capacity?: number;
}

export interface CreateProfileSubjectRequest {
  name: string;
  subjectType?: "major" | "minor";
}

export interface UpdateProfileSubjectRequest {
  name?: string;
}