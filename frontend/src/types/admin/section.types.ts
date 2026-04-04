export interface Section {
  id: string;
  org_id: string;      // ← matches actual API response
  level_id: string;    // ← matches actual API response
  name: string;
  capacity: number;
  deleted_at: string | null;
  studentCount?: number;
}