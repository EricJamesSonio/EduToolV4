import { ProgramType } from '../dto/program.dto';

export class CourseSnapshot {
  id!: string;
  name!: string;
  code!: string | null;
  levelCount?: number;
  sectionCount?: number;
}

export class StrandSnapshot {
  id!: string;
  name!: string;
  levelCount?: number;
  sectionCount?: number;
}

export class ProgramEntity {
  id!: string;
  orgId!: string;
  schoolYearId!: string; // ← add this
  name!: string;
  type!: ProgramType;
  courses!: CourseSnapshot[];
  strands!: StrandSnapshot[];
}
