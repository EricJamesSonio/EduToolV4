export interface ContextTableRow {
  id: string;
  peId: string;
  studentUuid: string;
  studentId: string | null;
  studentName: string;
  programName: string;
  sectionId: string | null;
  sectionName: string | null;
}