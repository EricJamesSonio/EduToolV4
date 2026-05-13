export interface Organization {
  id: string;
  name: string;
  description: string | null;
  emailExtension: string | null;
}

export interface CreateOrganizationDto {
  name: string;
  description?: string;
  emailExtension?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  emailExtension?: string;
}

export interface GradingScaleRangePayload {
  label: string;
  minScore: number;
  maxScore: number;
  gradeValue: string;
}

export interface GradingScalePayload {
  presetKey: string;
  name: string;
  ranges: GradingScaleRangePayload[];
}

export interface SectionSeedItem {
  name: string;
  capacity: number;
}

export interface SeedOrganizationDto {
  schoolYearId: string;
  programs: string[];
  courses?: string[];
  strands?: string[];
  excludedLevels?: string[];
  excludedSubjects?: string[];
  excludedLevelSubjects?: Record<string, string[]>;
  excludedGradingSchemePrograms?: string[];
  excludedSemesterTemplatePrograms?: string[];
  levelConfigs?: Record<string, string[]>;
  gradingScales?: Record<string, GradingScalePayload>;
  sectionConfigs?: Record<string, SectionSeedItem[]>;
}

export interface SeedOrganizationResponse {
  success: boolean;
  message: string;
}
