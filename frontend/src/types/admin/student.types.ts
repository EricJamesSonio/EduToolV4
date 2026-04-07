export type StudentStatus =
  | "pending"
  | "active"
  | "suspended"
  | "dropped"
  | "transferred"
  | "graduated";

export interface Student {
  id:        string;
  orgId:     string;
  fullName:  string;
  email:     string;
  studentId: string;
  status:    StudentStatus;
  createdAt: string;
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