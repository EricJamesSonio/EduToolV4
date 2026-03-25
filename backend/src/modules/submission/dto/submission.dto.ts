// src/modules/submission/dto/submission.dto.ts
import {
  IsArray,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Answer entry ──────────────────────────────────────────────────────────────

export class AnswerEntryDto {
  @IsUUID()
  questionId: string;

  @IsString()
  answer: string;
}

// ── POST /assessments/:assessmentId/submit ────────────────────────────────────

export class StartSubmissionDto {
  // No body needed — studentId comes from JWT
}

// ── PATCH /assessments/:assessmentId/submit/save ──────────────────────────────

export class SaveDraftDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AnswerEntryDto)
  answers: AnswerEntryDto[];
}

// ── POST /assessments/:assessmentId/submit/finish ─────────────────────────────

export class FinishSubmissionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerEntryDto)
  answers: AnswerEntryDto[];
}