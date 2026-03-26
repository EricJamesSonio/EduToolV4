import { LevelSection } from "./level.types";

export interface Section {
  id: string;
  orgId: string;
  name: string;
  levelSection: LevelSection;
  gradeLevel: string;
  courseOrStrand: string | null;
  capacity: number;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}