export type SchoolYearStatus = "pending" | "active" | "ended";

export interface SchoolYear {
  id: string;
  orgId: string;
  title: string;
  startYear: number;
  endYear: number;
  status: SchoolYearStatus;
  createdAt: string;
  updatedAt: string;
}