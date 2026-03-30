export type SchoolYearStatus = "pending" | "active" | "ended";

export interface SchoolYear {
  id: string;
  org_id: string;
  name: string;
  status: SchoolYearStatus;
}