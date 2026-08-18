// @/modules/assessment/dto/assessment.dto.ts
import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  IsIn,
  IsDateString,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Grading mode ──────────────────────────────────────────────────────────────

export enum GradingMode {
  SYSTEM = 'system',
  MANUAL = 'manual',
  HYBRID = 'hybrid',
}

// ── Question type options ─────────────────────────────────────────────────────

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_or_false',
  'identification',
  'enumeration',
  'essay',
  'manual',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ASSESSMENT_TYPES = [
  'written_work',
  'performance_task',
  'quarterly_assessment',
  'exam',
  'quiz',
  'assignment',
  'project',
  'recitation',
  'participation',
  'behavior',
  'attendance',
  'activity',
  'custom',
  'other',
] as const;

// ── Item range for generation config ─────────────────────────────────────────

export class ItemRangeDto {
  @IsInt()
  @Min(1)
  from: number;

  @IsInt()
  @Min(1)
  to: number;

  @IsIn(QUESTION_TYPES)
  questionType: QuestionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conceptSections: string[]; // section names from concept build — empty for manual sections

  @IsOptional()
  @IsString()
  manualQuestionText?: string; // educator-written question text for manual sections

  @IsOptional()
  @IsInt()
  @Min(0)
  manualMaxScore?: number; // max score for this manual section (1 question = N points)
}

// ── POST /classes/:classId/assessments ───────────────────────────────────────

export class CreateAssessmentDto {
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsUUID()
  termId: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsInt()
  @Min(1)
  totalItems: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemRangeDto)
  ranges?: ItemRangeDto[];

  @IsOptional()
  @IsEnum(GradingMode)
  gradingMode?: GradingMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  manualMaxScore?: number;

  @IsOptional()
  @IsBoolean()
  showBreakdown?: boolean;

  @IsOptional()
  @IsString()
  manualInstructions?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weekNumber?: number;
}

// ── PATCH /assessments/:id ────────────────────────────────────────────────────

export class UpdateAssessmentDto {
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(GradingMode)
  gradingMode?: GradingMode;

  @IsOptional()
  @IsBoolean()
  showBreakdown?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  manualMaxScore?: number;

  @IsOptional()
  @IsString()
  manualInstructions?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weekNumber?: number;
}

// ── PATCH /assessments/:id/questions/:questionId ──────────────────────────────

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  choices?: string[]; // for multiple_choice — stored in metadata

  @IsOptional()
  @IsBoolean()
  isManual?: boolean;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weekNumber?: number;
}

// ── POST /assessments/:id/grade-visibility ────────────────────────────────────

export class SetGradeVisibilityDto {
  @IsBoolean()
  showBreakdown: boolean;
}

// ── GET /classes/:classId/assessments ────────────────────────────────────────

export class QueryAssessmentDto {
  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weekNumber?: number;
}

// ── POST /assessments/:id/publish ────────────────────────────────────────────

export class PublishScoresDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[]; // if empty → publish all
}

// ── POST /assessments/:id/reopen ─────────────────────────────────────────────

export class ReopenAssessmentDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  studentIds: string[];

  @IsDateString()
  reopenedUntil: string;
}

// ── POST /assessments/:id/assign-students ────────────────────────────────────

export class AssignStudentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  studentIds: string[];
}

// ── PATCH /assessments/:id/submissions/:submissionId/grade ───────────────────

export class GradeEssayDto {
  @IsInt()
  @Min(0)
  score: number;
}

// ── PATCH /assessments/:id/submissions/:submissionId/status ──────────────────

export class UpdateSubmissionStatusDto {
  @IsIn(['exempted', 'custom', 'missed'])
  status: 'exempted' | 'custom' | 'missed';

  @IsOptional()
  @IsInt()
  @Min(0)
  manualScore?: number;
}
