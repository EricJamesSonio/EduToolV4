import { DatabaseService } from '@/core/database/database.provider';

export interface SeedCount {
  seeded: number;
  already_exists: number;
  skipped: number;
}

export interface SeedResult {
  programs: SeedCount;
  courses: SeedCount;
  strands: SeedCount;
  levels: SeedCount;
  sections: SeedCount;
  subjects: SeedCount;
  gradingScales: SeedCount;
  gradingSchemeTemplates: SeedCount;
  semesterTemplates: SeedCount;
  programCalendars: SeedCount;
  /** Non-fatal issues surfaced to the admin (e.g. template not auto-registered due to calendar mismatch). */
  warnings: string[];
}

export function emptyCount(): SeedCount {
  return { seeded: 0, already_exists: 0, skipped: 0 };
}

export interface GradingScaleRangeOption {
  label: string;
  minScore: number;
  maxScore: number;
  gradeValue: string;
}

export interface GradingScaleOption {
  presetKey: string;
  name: string;
  ranges: GradingScaleRangeOption[];
}

export interface ProgramCalendarBreakSeed {
  label: string;
  startDate: string;
  endDate: string;
}

export interface ProgramCalendarSeedOption {
  startDate: string;
  endDate: string;
  notes?: string;
  breaks?: ProgramCalendarBreakSeed[];
}

export interface OrgSeedOptions {
  orgId: string;
  schoolYearId: string;
  programs: string[];
  courses?: string[];
  strands?: string[];
  excludedLevels?: string[];
  excludedSubjects?: string[];
  excludedLevelSubjects?: Record<string, string[]>;
  levelConfigs?: Record<string, string[]>;
  sectionConfigs?: Record<string, { name: string; capacity: number }[]>;
  gradingScales?: Record<string, GradingScaleOption>;
  seedGradingScales?: boolean;
  seedGradingSchemes?: boolean;
  seedSemesterTemplates?: boolean;
  seedProgramCalendars?: boolean;
  programCalendars?: Record<string, ProgramCalendarSeedOption>;
}

export class SeedContext {
  readonly orgId: string;
  readonly schoolYearId: string;
  readonly db: DatabaseService;

  readonly selectedPrograms: Set<string>;
  readonly selectedCourses: Set<string>;
  readonly selectedStrands: Set<string>;
  readonly excludedLevelSet: Set<string>;
  readonly excludedSubjSet: Set<string>;
  readonly excludedLevelSubjects: Record<string, string[]>;
  readonly levelConfigs: Record<string, string[]>;
  readonly sectionConfigs: Record<string, { name: string; capacity: number }[]>;
  readonly gradingScales: Record<string, GradingScaleOption>;
  readonly seedGradingScales: boolean;
  readonly seedGradingSchemes: boolean;
  readonly seedSemesterTemplates: boolean;

  readonly seedProgramCalendars: boolean;
  readonly programCalendars: Record<string, ProgramCalendarSeedOption>;

  readonly programMap: Record<string, string> = {};
  readonly courseMap: Record<string, string> = {};
  readonly strandMap: Record<string, string> = {};
  readonly levelMap: Record<string, string> = {};
  readonly subjectNameToId: Record<string, string> = {};

  readonly result: SeedResult = {
    programs: emptyCount(),
    courses: emptyCount(),
    strands: emptyCount(),
    levels: emptyCount(),
    sections: emptyCount(),
    subjects: emptyCount(),
    gradingScales: emptyCount(),
    gradingSchemeTemplates: emptyCount(),
    semesterTemplates: emptyCount(),
    programCalendars: emptyCount(),
    warnings: [],
  };

  constructor(db: DatabaseService, options: OrgSeedOptions) {
    this.db = db;
    this.orgId = options.orgId;
    this.schoolYearId = options.schoolYearId;
    this.selectedPrograms = new Set(options.programs);
    this.selectedCourses = new Set(options.courses ?? []);
    this.selectedStrands = new Set(options.strands ?? []);
    this.excludedLevelSet = new Set(options.excludedLevels ?? []);
    this.excludedSubjSet = new Set(options.excludedSubjects ?? []);
    this.excludedLevelSubjects = options.excludedLevelSubjects ?? {};
    this.levelConfigs = options.levelConfigs ?? {};
    this.sectionConfigs = options.sectionConfigs ?? {};
    this.gradingScales = options.gradingScales ?? {};
    this.seedGradingScales = options.seedGradingScales ?? true;
    this.seedGradingSchemes = options.seedGradingSchemes ?? true;
    this.seedSemesterTemplates = options.seedSemesterTemplates ?? true;
    this.seedProgramCalendars = options.seedProgramCalendars ?? false;
    this.programCalendars = options.programCalendars ?? {};
  }

  shouldSeedProgram(key: string): boolean {
    return this.selectedPrograms.has(key);
  }

  shouldSeedCourse(code: string): boolean {
    return this.selectedCourses.size === 0 || this.selectedCourses.has(code);
  }

  shouldSeedStrand(name: string): boolean {
    return this.selectedStrands.size === 0 || this.selectedStrands.has(name);
  }

  shouldSeedLevel(name: string): boolean {
    return !this.excludedLevelSet.has(name);
  }

  shouldSeedSubject(
    name: string,
    levelName?: string,
    strandName?: string,
    courseCode?: string,
  ): boolean {
    if (this.excludedSubjSet.has(name)) return false;
    if (levelName && this.excludedLevelSubjects[levelName]?.includes(name))
      return false;
    if (strandName && this.excludedLevelSubjects[strandName]?.includes(name))
      return false;
    if (courseCode && this.excludedLevelSubjects[courseCode]?.includes(name))
      return false;
    return true;
  }
}
