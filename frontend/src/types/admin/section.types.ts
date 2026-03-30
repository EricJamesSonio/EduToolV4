//import { Level } from "./level.types";

export interface Section {
  id: string;
  orgId: string;
  levelId: string;
  name: string;
  capacity: number;
  studentCount?: number;
}