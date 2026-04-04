// frontend/src/types/admin/course.types.ts

export interface Course {
  id: string;
  orgId: string;    // backend entity has org_id — add mapToEntity if needed (see note below)
  programId: string;
  name: string;
  code: string | null;
  createdAt?: string;
}