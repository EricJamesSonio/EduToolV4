// Grading Scheme Types
// Mirrors backend DTOs and entities for grading scheme templates and schemes

export type ComponentType =
  | 'written_work'
  | 'performance_task'
  | 'quarterly_assessment'
  | 'exam'
  | 'quiz'
  | 'project'
  | 'recitation'
  | 'attendance'
  | 'activity'
  | 'custom'
  | 'manual'
  | 'other';

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  written_work: 'Written Work',
  performance_task: 'Performance Task',
  quarterly_assessment: 'Quarterly Assessment',
  exam: 'Exam',
  quiz: 'Quiz',
  project: 'Project',
  recitation: 'Recitation',
  attendance: 'Attendance',
  activity: 'Activity',
  custom: 'Custom',
  manual: 'Manual',
  other: 'Other',
};

export const COMPONENT_TYPES: ComponentType[] = [
  'written_work',
  'performance_task',
  'quarterly_assessment',
  'exam',
  'quiz',
  'project',
  'recitation',
  'attendance',
  'activity',
  'custom',
  'manual',
  'other',
];

// ─── Template entities (read from API) ────────────────────────────────────────

export interface GradingSchemeTemplateComponent {
  id: string;
  orgId: string;
  templateId: string;
  name: string;
  type: ComponentType;
  weight: number;
  maxScore: number | null;
}

export interface GradingSchemeTemplate {
  id: string;
  orgId: string;
  name: string;
  programType: string | null;
  createdAt: string;
  components: GradingSchemeTemplateComponent[];
}

// ─── DTOs (sent to API) ───────────────────────────────────────────────────────

export interface GradingSchemeTemplateComponentDto {
  name: string;
  type: ComponentType;
  weight: number;
  maxScore?: number;
}

export interface CreateGradingSchemeTemplateDto {
  name: string;
  programType?: string;
  components: GradingSchemeTemplateComponentDto[];
}

export interface UpdateGradingSchemeTemplateDto {
  name?: string;
  programType?: string;
  components?: GradingSchemeTemplateComponentDto[];
}

// ─── Form state (internal UI) ─────────────────────────────────────────────────

export interface ComponentFormRow {
  name: string;
  type: ComponentType;
  weight: number | '';
  maxScore: number | '';
}

export interface TemplateFormState {
  name: string;
  programType: string;
  components: ComponentFormRow[];
}