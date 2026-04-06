import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator'

export class CreateSubjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string

  @IsUUID()
  levelId: string

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
  schoolYearId?: string   // ← added: scopes subjects to a school year via their level

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
}