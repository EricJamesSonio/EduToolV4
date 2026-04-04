// frontend/src/types/admin/student.types.ts

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
  studentId: string;        // was: studentCode — now matches backend metadata field
  status: StudentStatus;
  levelId: string;          // was: levelSection: Level + gradeLevel (backend returns flat IDs)
  sectionId: string | null;
  createdAt: string;
  // omitted: updatedAt (not in backend formatAccount), courseOrStrand, sectionName (not returned)
}

export interface StudentCredentials {
  fullName: string;
  email: string;
  studentId: string;        // was: studentCode
  password: string;
}

export interface BulkImportResult {
  status: "success" | "validation_failed";
  totalRows?: number;
  totalCreated?: number;
  validCount?: number;
  invalidCount?: number;
  students?: Student[];
  errors?: Array<{
    row: number;
    data: Record<string, string>;
    errors: string[];
  }>;
  message?: string;
}