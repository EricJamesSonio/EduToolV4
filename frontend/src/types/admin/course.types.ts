export interface Course {
  id: string;
  orgId: string;
  schoolYearId: string; // added — schema school_year_id is now required
  programId: string;
  name: string;
  code: string | null;
  createdAt?: string;
}