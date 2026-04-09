export interface Section {
  id: string;
  org_id: string;
  level_id: string;
  name: string;
  capacity: number;
  deleted_at: string | null;
  studentCount: number; // remove the ?
}
