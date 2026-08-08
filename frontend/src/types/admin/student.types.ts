export type StudentStatus =
  | "pending"
  | "active"
  | "suspended"
  | "dropped"
  | "transferred"
  | "graduated";

export interface Student {
  id:            string;
  orgId:         string;
  fullName:      string;
  email:         string;
  personalEmail: string | null;
  studentId:     string;
  status:        StudentStatus;
  createdAt:     string;
  levelId:       string | null;
  sectionId:     string | null;
  levelName:     string | null;
  sectionName:   string | null;
  programName:   string | null;
  courseName:    string | null;
  strandName:    string | null;
  profileImage?: string | null;
}

export interface StudentCredentials {
  fullName:  string;
  email:     string;
  studentId: string;
  password:  string;
}

export interface BulkImportResult {
  status:       "success" | "validation_failed";
  totalRows?:   number;
  totalCreated?: number;
  importedCount?: number;
  validCount?:  number;
  invalidCount?: number;
  students?:    Student[];
  errors?: Array<{
    row:    number;
    data:   Record<string, string>;
    errors: string[];
  }>;
  message?: string;
}