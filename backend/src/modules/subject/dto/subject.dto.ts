import {
  IsString, IsOptional, IsUUID, IsIn, IsInt,
  MinLength, MaxLength, Min, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
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

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
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