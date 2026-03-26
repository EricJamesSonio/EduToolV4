import { LevelSection } from "./level.types";

export type StudentStatus =
  | "pending"
  | "active"
  | "suspended"
  | "dropped"
  | "transferred"
  | "graduated";

export interface Student {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  studentCode: string;
  status: StudentStatus;
  levelSection: LevelSection;
  gradeLevel: string;
  sectionId: string | null;
  sectionName: string | null;
  courseOrStrand: string | null;
  createdAt: string;
  updatedAt: string;
  /** Only present immediately after creation or password reset */
  password?: string;
}

export interface StudentCredentials {
  fullName: string;
  email: string;
  studentCode: string;
  password: string;
}

export interface BulkImportRow {
  rowNumber: number;
  fullName: string;
  studentCode: string;
  email: string;
  levelSection: LevelSection;
  gradeLevel: string;
  section: string;
  strand: string | null;
  course: string | null;
}

export interface BulkImportValidationResult {
  validRows: BulkImportRow[];
  errorRows: Array<{
    rowNumber: number;
    data: Partial<BulkImportRow>;
    error: string;
  }>;
}