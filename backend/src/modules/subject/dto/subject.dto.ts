import {
  IsString, IsOptional, IsUUID, IsIn,
  MinLength, MaxLength, ValidateIf,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @IsIn(['major', 'minor'])
  subjectType?: 'major' | 'minor';

  // required for both major and minor
  @IsUUID()
  programId!: string;

  // major: required if program is college-type (course-based)
  @IsOptional()
  @IsUUID()
  courseId?: string;

  // major: required if program is shs-type (strand-based)
  @IsOptional()
  @IsUUID()
  strandId?: string;

  // major: level within the program
  // minor: required (level this minor subject belongs to)
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