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
  Min,
  Max,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Question type options ─────────────────────────────────────────────────────

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_or_false',
  'identification',
  'enumeration',
  'essay',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ASSESSMENT_TYPES = [
  'quiz',
  'activity',
  'exam',
  'custom',
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

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  conceptSections: string[]; // section names from concept build
}

// ── POST /classes/:classId/assessments ───────────────────────────────────────

export class CreateAssessmentDto {
  @IsUUID()
  lessonId: string;

  @IsUUID()
  termId: string;

  @IsIn(ASSESSMENT_TYPES)
  type: string;

  @IsInt()
  @Min(1)
  totalItems: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ItemRangeDto)
  ranges: ItemRangeDto[];

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
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
  @IsIn(ASSESSMENT_TYPES)
  type?: string;
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
}

// ── GET /classes/:classId/assessments ────────────────────────────────────────

export class QueryAssessmentDto {
  @IsOptional()
  @IsUUID()
  termId?: string;

  @IsOptional()
  @IsIn(ASSESSMENT_TYPES)
  type?: string;
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
  @IsIn(['exempted', 'custom'])
  status: 'exempted' | 'custom';

  @IsOptional()
  @IsInt()
  @Min(0)
  manualScore?: number;
}