import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsInt,
  IsArray,
  IsBooleanString,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

const SUBJECT_NAME_PATTERN = /^[\p{L}\p{N} ,.'&()\/:-]+$/u;
const SUBJECT_NAME_MESSAGE =
  'Subject name may only contain letters, numbers, spaces and , . \' & ( ) / : -';
const SUBJECT_CODE_PATTERN = /^[\p{L}\p{N} ./-]*$/u;
const SUBJECT_CODE_MESSAGE =
  'Subject code may only contain letters, numbers, spaces and . / -';

export class SubjectSessionRequirementDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  sessionsPerWeek?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  sessionMinutes?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(5, { each: true })
  @Max(480, { each: true })
  sessionDurations?: number[];
}

export class CreateSubjectDto extends SubjectSessionRequirementDto {
  @IsString()
  @Matches(SUBJECT_NAME_PATTERN, { message: SUBJECT_NAME_MESSAGE })
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(SUBJECT_CODE_PATTERN, { message: SUBJECT_CODE_MESSAGE })
  code?: string;

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
  @IsOptional()
  @IsString()
  @Matches(SUBJECT_NAME_PATTERN, { message: SUBJECT_NAME_MESSAGE })
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(SUBJECT_CODE_PATTERN, { message: SUBJECT_CODE_MESSAGE })
  code?: string;

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
  @IsBooleanString()
  archived?: string;

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