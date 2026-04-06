import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator'

export class CreateSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string

  @IsOptional()
  @IsUUID()
  levelId?: string

  @IsOptional()
  @IsString()
  @IsIn(['major', 'minor'])
  subjectType?: 'major' | 'minor'

  // Required when subjectType is 'minor'
  @ValidateIf((o) => o.subjectType === 'minor')
  @IsUUID()
  programId?: string

  @IsOptional()
  @IsUUID()
  educatorId?: string

  @IsOptional()
  @IsUUID()
  courseId?: string

  @IsOptional()
  @IsUUID()
  strandId?: string

  @IsOptional()
  @IsString()
  yearLevel?: string

  @IsOptional()
  @IsString()
  termLabel?: string
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string

  @IsOptional()
  @IsUUID()
  levelId?: string

  @IsOptional()
  @IsUUID()
  educatorId?: string

  @IsOptional()
  @IsUUID()
  courseId?: string

  @IsOptional()
  @IsUUID()
  strandId?: string

  @IsOptional()
  @IsString()
  yearLevel?: string

  @IsOptional()
  @IsString()
  termLabel?: string
}

export class QuerySubjectDto {
  @IsOptional()
  @IsUUID()
  schoolYearId?: string

  @IsOptional()
  @IsUUID()
  levelId?: string

  @IsOptional()
  @IsUUID()
  educatorId?: string

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsUUID()
  courseId?: string

  @IsOptional()
  @IsUUID()
  strandId?: string

  @IsOptional()
  @IsIn(['open', 'coupled'])
  scope?: 'open' | 'coupled'

  @IsOptional()
  @IsString()
  yearLevel?: string

  @IsOptional()
  @IsString()
  termLabel?: string

  @IsOptional()
  @IsString()
  @IsIn(['major', 'minor'])
  subjectType?: 'major' | 'minor'
}

// Exactly one of courseId, strandId, or levelId must be provided.
// Validated in the service layer since class-validator cannot enforce mutual exclusivity cleanly.
export class ShareSubjectDto {
  @IsOptional()
  @IsUUID()
  courseId?: string

  @IsOptional()
  @IsUUID()
  strandId?: string

  @IsOptional()
  @IsUUID()
  levelId?: string
}