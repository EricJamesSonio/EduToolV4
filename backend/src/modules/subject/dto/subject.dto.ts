import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsInt,
  IsArray,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsEntityName } from '@/commons/validators/is-entity-name.validator';

/**
 * Shared by create and update: optional weekly session requirement.
 *
 * Declared before the subclasses because `extends` is evaluated at class
 * definition time — a base class declared further down would be in the TDZ.
 */
export class SubjectSessionRequirementDto {
  /** Times per week. 1-7. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  sessionsPerWeek?: number;

  /** Length of each session in minutes. Must be a multiple of the org slot. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  sessionMinutes?: number;

  /**
   * Length of EACH weekly session, position by position. Must be either empty
   * (meaning "uniform": every session uses `sessionMinutes`) or exactly one
   * entry per weekly session. Each entry must be a multiple of the org slot,
   * checked in the service.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(5, { each: true })
  @Max(480, { each: true })
  sessionDurations?: number[];
}

export class CreateSubjectDto extends SubjectSessionRequirementDto {
  @IsEntityName()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @IsIn(['major', 'minor'])
  subjectType?: 'major' | 'minor';

  @IsUUID()
  programId!: string;

  @ValidateIf((o) => o.subjectType !== 'minor')
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ValidateIf((o) => o.subjectType !== 'minor')
  @IsOptional()
  @IsUUID()
  strandId?: string;

  @ValidateIf((o) => o.subjectType === 'minor')
  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsString()
  yearLevel?: string;

  @IsOptional()
  @IsString()
  termLabel?: string;
}

export class UpdateSubjectDto extends SubjectSessionRequirementDto {
  @IsEntityName()
  @IsOptional()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['major', 'minor'])
  subjectType?: 'major' | 'minor';

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  @IsOptional()
  @IsString()
  yearLevel?: string;

  @IsOptional()
  @IsString()
  termLabel?: string;
}

export class QuerySubjectDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  @IsOptional()
  @IsIn(['open', 'coupled'])
  scope?: 'open' | 'coupled';

  @IsOptional()
  @IsString()
  yearLevel?: string;

  @IsOptional()
  @IsString()
  termLabel?: string;

  @IsOptional()
  @IsString()
  @IsIn(['major', 'minor'])
  subjectType?: 'major' | 'minor';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class SubjectHierarchyQueryDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  /**
   * Narrows the PRIMARY subject set to a single level. The response still
   * returns every in-scope level in `levels` (so the client dropdown keeps all
   * options), and direct prerequisites from other levels are still included as
   * linked context.
   */
  @IsOptional()
  @IsUUID()
  levelId?: string;
}

export class ShareSubjectDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  strandId?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;
}
